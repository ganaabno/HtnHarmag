"""Freeze only product geometry; bake the existing PBR graphs, not lighting."""
import bpy
import os
import json
import math
import hashlib
import bmesh
from mathutils import Vector

OUT = r'C:\Users\77\dev\blender\refined_glb_repair'
os.makedirs(os.path.join(OUT, 'textures'), exist_ok=True)
source = bpy.context.scene
dg = bpy.context.evaluated_depsgraph_get()
report = {'source_blend': bpy.data.filepath, 'objects': [], 'material_bakes': []}


def enum_value(owner, prop, wanted):
    values = [v.identifier for v in owner.bl_rna.properties[prop].enum_items]
    return next(v for v in values if v == wanted)


frozen = []
for cname in ['PRODUCT_POUCH', 'PRODUCT_CAP', 'PRODUCT_SPOUT']:
    for obj in bpy.data.collections[cname].objects:
        if obj.type not in {'MESH', 'CURVE'}:
            continue
        mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
        mesh.transform(obj.matrix_world)
        mesh.update()
        used = set(i for p in mesh.polygons for i in p.vertices)
        seen, duplicate_faces = set(), 0
        for p in mesh.polygons:
            key = tuple(sorted(tuple(round(c, 9) for c in mesh.vertices[i].co) for i in p.vertices))
            duplicate_faces += key in seen
            seen.add(key)
        uv = mesh.uv_layers.active
        uvvalues = [tuple(v.uv) for v in uv.data] if uv else []
        info = {'name': obj.name, 'vertices': len(mesh.vertices), 'faces': len(mesh.polygons),
                'loose_vertices': len(mesh.vertices)-len(used), 'duplicate_faces': duplicate_faces,
                'zero_area_faces': sum(p.area < 1e-15 for p in mesh.polygons),
                'uv_map': uv.name if uv else None,
                'uv_range': [[min(p[a] for p in uvvalues), max(p[a] for p in uvvalues)] for a in range(2)] if uv else None,
                'nonfinite_vertices': sum(not all(math.isfinite(c) for c in v.co) for v in mesh.vertices),
                'bounds_blender_m': [[min(v.co[a] for v in mesh.vertices), max(v.co[a] for v in mesh.vertices)] for a in range(3)]}
        report['objects'].append(info)
        assert not info['loose_vertices'] and not info['nonfinite_vertices'] and not info['duplicate_faces'], info
        frozen.append((obj.name, mesh, list(mesh.materials)))
        print('AUDIT', info['name'], info['vertices'], 'vertices', flush=True)

# Independent UV plane lets Cycles evaluate the actual color/roughness/bump
# graph with the correct physical texel size, without including studio light.
bake_scene = bpy.data.scenes.new('PBR_BAKE_ONLY')
bpy.context.window.scene = bake_scene
bake_scene.render.engine = 'CYCLES'
bake_scene.cycles.device = enum_value(bake_scene.cycles, 'device', 'CPU')
bake_scene.cycles.samples = 1
bake_scene.render.bake.margin = 0
bake_scene.render.bake.use_clear = True
plane_mesh = bpy.data.meshes.new('Physical UV baking plane')
plane_mesh.from_pydata([(0,0,0),(.10229367,0,0),(.10229367,.16065,0),(0,.16065,0)], [], [(0,1,2,3)])
uv = plane_mesh.uv_layers.new(name='BakeUV')
for i,co in enumerate([(0,0),(1,0),(1,1),(0,1)]):
    uv.data[i].uv = co
plane = bpy.data.objects.new('PBR bake plane', plane_mesh)
bake_scene.collection.objects.link(plane)
plane.select_set(True)
bpy.context.view_layer.objects.active = plane

materials = {}
for _,_,mats in frozen:
    for mat in mats:
        materials[mat.name] = mat


def bake_channel(original, channel, size, label):
    mat = original.copy()
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
    output = next(n for n in nodes if n.type == 'OUTPUT_MATERIAL' and n.is_active_output)
    if channel != 'NORMAL':
        socket = bsdf.inputs['Base Color' if channel == 'COLOR' else 'Roughness']
        emission = nodes.new('ShaderNodeEmission')
        if socket.is_linked:
            links.new(socket.links[0].from_socket, emission.inputs['Color'])
        else:
            v = socket.default_value
            emission.inputs['Color'].default_value = tuple(v) if hasattr(v, '__len__') else (v,v,v,1)
        links.new(emission.outputs[0], output.inputs['Surface'])
    image = bpy.data.images.new(label, width=size, height=size, alpha=False)
    image.colorspace_settings.name = 'sRGB' if channel == 'COLOR' else 'Non-Color'
    target = nodes.new('ShaderNodeTexImage')
    target.image = image
    for n in nodes:
        n.select = False
    target.select = True
    nodes.active = target
    plane.data.materials.clear()
    plane.data.materials.append(mat)
    bpy.context.view_layer.update()
    print('BAKING', label, size, flush=True)
    bake_type = next(v.identifier for v in bpy.ops.object.bake.get_rna_type().properties['type'].enum_items if v.identifier == ('NORMAL' if channel == 'NORMAL' else 'EMIT'))
    kwargs = {'type': bake_type, 'margin': 0, 'use_clear': True}
    if channel == 'NORMAL':
        kwargs['normal_space'] = next(v.identifier for v in bpy.ops.object.bake.get_rna_type().properties['normal_space'].enum_items if v.identifier == 'TANGENT')
    bpy.ops.object.bake(**kwargs)
    image.filepath_raw = os.path.join(OUT, 'textures', label+'.png')
    image.file_format = enum_value(image, 'file_format', 'PNG')
    image.save()
    image.pack()
    plane.data.materials.clear()
    bpy.data.materials.remove(mat)
    return image


export_materials = {}
for index, (name, original) in enumerate(materials.items()):
    p = next(n for n in original.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    label = ['front' if 'FINAL_front' in name else 'back' if 'FINAL_back' in name else 'weld' if 'Heat weld' in name else 'cap' if 'Cap' in name else 'film'][0]
    if label == 'cap':
        # Cap's UV metric differs from that of the pouch; preserve it here.
        for v,co in zip(plane_mesh.vertices,[(0,0,0),(.072,0,0),(.072,.020,0),(0,.020,0)]): v.co=co
    else:
        for v,co in zip(plane_mesh.vertices,[(0,0,0),(.10229367,0,0),(.10229367,.16065,0),(0,.16065,0)]): v.co=co
    plane_mesh.update()
    color = bake_channel(original,'COLOR',2048 if label in ['front','back'] else 1024,label+'_basecolor') if p.inputs['Base Color'].is_linked else None
    rough = bake_channel(original,'ROUGHNESS',1024,label+'_roughness') if p.inputs['Roughness'].is_linked else None
    normal = bake_channel(original,'NORMAL',1024,label+'_normal') if p.inputs['Normal'].is_linked else None
    mat = bpy.data.materials.new('glTF_'+name)
    mat.use_nodes = True
    mat.use_backface_culling = original.use_backface_culling
    dest = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    for socket in ['Base Color','Metallic','Roughness','IOR','Alpha','Coat Weight','Coat Roughness','Transmission Weight']:
        dest.inputs[socket].default_value = p.inputs[socket].default_value
    def tex(im):
        n = mat.node_tree.nodes.new('ShaderNodeTexImage'); n.image=im
        return n
    if color: mat.node_tree.links.new(tex(color).outputs['Color'],dest.inputs['Base Color'])
    if rough: mat.node_tree.links.new(tex(rough).outputs['Color'],dest.inputs['Roughness'])
    if normal:
        n = mat.node_tree.nodes.new('ShaderNodeNormalMap'); n.inputs['Strength'].default_value=1
        mat.node_tree.links.new(tex(normal).outputs['Color'],n.inputs['Color'])
        mat.node_tree.links.new(n.outputs['Normal'],dest.inputs['Normal'])
    export_materials[name] = mat
    report['material_bakes'].append({'source':name,'export':mat.name,'basecolor':color.name if color else 'original constant','roughness':rough.name if rough else p.inputs['Roughness'].default_value,'normal':normal.name if normal else None})

clean = bpy.data.scenes.new('PRODUCT_ONLY_GLTF_READY')
clean.unit_settings.scale_length = source.unit_settings.scale_length
bpy.context.window.scene = clean
root = bpy.data.objects.new('SERGEENEE_CURRENT_POUCH',None)
clean.collection.objects.link(root)
for name, mesh, mats in frozen:
    mesh.materials.clear()
    for mat in mats:
        mesh.materials.append(export_materials[mat.name])
    obj = bpy.data.objects.new(name,mesh)
    clean.collection.objects.link(obj)
    obj.parent=root
    obj.select_set(True)
root.select_set(True)
points = [v.co for _,m,_ in frozen for v in m.vertices]
report['bounds_blender_m'] = [[min(p[a] for p in points),max(p[a] for p in points)] for a in range(3)]
report['dimensions_m'] = [b-a for a,b in report['bounds_blender_m']]
report['product_meshes'] = len(frozen)
report['shape_preservation'] = 'Exact evaluated current world-space vertices; shape keys, solidify, subdivision, bevel and curve conversion frozen in export copies only.'
report['exclusions'] = ['Dark_studio_floor (200x200 m)','SHAPE_BACKUP_before_polish meshes','reference images','artwork helpers','cameras','studio lights']
# Stabilize triangulation on the export copies without changing any vertex coordinates.
for obj in clean.objects:
    if obj.type != 'MESH': continue
    mesh = obj.data
    before = [tuple(v.co) for v in mesh.vertices]
    bm = bmesh.new(); bm.from_mesh(mesh)
    bmesh.ops.triangulate(bm, faces=list(bm.faces)); bm.to_mesh(mesh); bm.free()
    mesh.update(); mesh.calc_tangents(uvmap=mesh.uv_layers.active.name)
    assert before == [tuple(v.co) for v in mesh.vertices], obj.name
    for entry in report['objects']:
        if entry['name'] == obj.name: entry['triangulation_vertex_delta_m'] = 0
path = os.path.join(OUT,'sergeenee_surface_refined_repaired.glb')
print('EXPORTING',path,flush=True)
bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, use_active_scene=True,
    export_apply=False, export_animations=False, export_morph=False, export_cameras=False,
    export_lights=False, export_tangents=True, export_normals=True, export_texcoords=True,
    export_yup=True, use_mesh_edges=False, use_mesh_vertices=False)
# The companion .blend contains only product objects, so default all-scene
# exports cannot accidentally reintroduce backup meshes or the studio floor.
for scene in list(bpy.data.scenes):
    if scene != clean: bpy.data.scenes.remove(scene)
for obj in list(bpy.data.objects):
    if obj.name not in clean.objects: bpy.data.objects.remove(obj,do_unlink=True)
clean.render.engine='CYCLES'
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'sergeenee_surface_refined_gltf_ready.blend'))
with open(os.path.join(OUT,'blender_export_report.json'),'w',encoding='utf-8') as f: json.dump(report,f,indent=2,ensure_ascii=False)
print('REPAIR_EXPORT_COMPLETE',json.dumps(report['dimensions_m']),flush=True)
