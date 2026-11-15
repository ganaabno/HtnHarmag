"""Run with Blender against a copy of the current refined source, never the live file."""
import bpy, bmesh, json, math, hashlib, os
from collections import Counter

OUT = r'C:\Users\77\dev\blender\refined_glb_repair'
os.makedirs(OUT, exist_ok=True)
source = bpy.context.scene
dg = bpy.context.evaluated_depsgraph_get()
report = {'source': bpy.data.filepath, 'objects': [], 'materials': []}
frozen = []
materials = {}
for cname in ['PRODUCT_POUCH', 'PRODUCT_CAP', 'PRODUCT_SPOUT']:
    for obj in bpy.data.collections[cname].objects:
        if obj.type not in {'MESH', 'CURVE'}: continue
        mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
        mesh.transform(obj.matrix_world)
        mesh.update()
        mesh.calc_loop_triangles()
        uv = mesh.uv_layers.active
        bm = bmesh.new(); bm.from_mesh(mesh)
        faces = [tuple(sorted(tuple(round(c, 9) for c in mesh.vertices[i].co) for i in p.vertices)) for p in mesh.polygons]
        entry = {'name': obj.name, 'vertices': len(mesh.vertices), 'faces': len(mesh.polygons),
                 'modifiers': [(m.type, m.show_viewport, m.show_render) for m in obj.modifiers],
                 'shape_values': {k.name:k.value for k in obj.data.shape_keys.key_blocks} if obj.type=='MESH' and obj.data.shape_keys else {},
                 'position_sha256': hashlib.sha256(b''.join(__import__('struct').pack('3f',*v.co) for v in mesh.vertices)).hexdigest(),
                 'duplicate_faces': len(faces)-len(set(faces)),
                 'zero_area_faces': sum(f.calc_area()<1e-15 for f in bm.faces),
                 'nonmanifold_edges': sum(not e.is_manifold for e in bm.edges),
                 'nonfinite_vertices': sum(not all(math.isfinite(c) for c in v.co) for v in mesh.vertices),
                 'material_faces': dict(Counter(mesh.materials[p.material_index].name for p in mesh.polygons)),
                 'uv_layers': [{'name':u.name,'active_render':u.active_render} for u in mesh.uv_layers],
                 'uv_sha256': hashlib.sha256(b''.join(__import__('struct').pack('2f',*l.uv) for l in uv.data)).hexdigest() if uv else None,
                 'uv_range': [[min(l.uv[a] for l in uv.data),max(l.uv[a] for l in uv.data)] for a in range(2)] if uv else None,
                 'nonfinite_uvs': sum(not all(math.isfinite(c) for c in l.uv) for l in uv.data) if uv else None}
        bm.free()
        assert not entry['duplicate_faces'] and not entry['zero_area_faces'] and not entry['nonfinite_vertices'], entry
        assert uv and not entry['nonfinite_uvs'], entry
        report['objects'].append(entry)
        for mat in mesh.materials: materials[mat.name]=mat
        frozen.append((obj.name,mesh))

for mat in materials.values():
    nodes=mat.node_tree.nodes
    p=next(n for n in nodes if n.type=='BSDF_PRINCIPLED')
    inputs={}
    for s in p.inputs:
        if s.name not in ['Base Color','Metallic','Roughness','Alpha','Normal','Coat Weight','Coat Roughness','Coat Normal']: continue
        inputs[s.name]={'default':list(s.default_value) if hasattr(s.default_value,'__len__') else s.default_value,
                        'links':[(l.from_node.type,l.from_socket.name) for l in s.links]}
    report['materials'].append({'name':mat.name,'inputs':inputs,
       'nodes':[(n.name,n.type) for n in nodes],
       'links':[(l.from_node.name,l.from_socket.name,l.to_node.name,l.to_socket.name) for l in mat.node_tree.links],
       'images':[{'name':n.image.name,'size':list(n.image.size),'color_space':n.image.colorspace_settings.name,
                  'packed':bool(n.image.packed_file),'vector_links':[(l.from_node.type,l.from_socket.name) for l in n.inputs['Vector'].links]} for n in nodes if n.type=='TEX_IMAGE' and n.image]})

clean=bpy.data.scenes.new('CONTROLLED_PRODUCT_ONLY')
bpy.context.window.scene=clean
for name,mesh in frozen:
    obj=bpy.data.objects.new(name,mesh); clean.collection.objects.link(obj);obj.select_set(True)
    bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.triangulate(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free();mesh.update()
    mesh.calc_tangents(uvmap=mesh.uv_layers.active.name)

def export(name):
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,name),export_format='GLB',use_active_scene=True,
        use_selection=True,export_apply=False,export_animations=False,export_morph=False,
        export_cameras=False,export_lights=False,export_tangents=True,export_normals=True,export_texcoords=True,
        use_mesh_edges=False,use_mesh_vertices=False)

export('isolation_original_materials.glb')
red=bpy.data.materials.new('ISOLATION_OPAQUE_RED');red.use_nodes=True
p=next(n for n in red.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
p.inputs['Base Color'].default_value=(.5,.012,.006,1)
p.inputs['Metallic'].default_value=0;p.inputs['Roughness'].default_value=.5;p.inputs['Alpha'].default_value=1
for obj in clean.objects:
    for i in range(len(obj.data.materials)):obj.data.materials[i]=red
export('isolation_red.glb')
with open(os.path.join(OUT,'diagnosis.json'),'w',encoding='utf-8') as f:json.dump(report,f,indent=2,ensure_ascii=False)
print('DIAGNOSTIC_EXPORTS_COMPLETE',len(frozen),flush=True)
