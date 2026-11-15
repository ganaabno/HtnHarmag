"""Reimport the candidate into a new scene; compare it to evaluated refined source."""
import bpy, json, math, os, re
from mathutils import Vector, kdtree

OUT=r'C:\Users\77\dev\blender\refined_glb_repair'
EVIDENCE=r'C:\Users\77\dev\hatanharmag\docs\qa\refined-repair'
dg=bpy.context.evaluated_depsgraph_get()
source={}
for cname in ['PRODUCT_POUCH','PRODUCT_CAP','PRODUCT_SPOUT']:
    for obj in bpy.data.collections[cname].objects:
        if obj.type not in {'MESH','CURVE'}:continue
        mesh=bpy.data.meshes.new_from_object(obj.evaluated_get(dg),preserve_all_data_layers=True,depsgraph=dg)
        mesh.transform(obj.matrix_world)
        source[obj.name]={'points':[v.co.copy() for v in mesh.vertices],
                         'uvs':[(mesh.vertices[l.vertex_index].co.copy(),mesh.uv_layers.active.data[l.index].uv.copy()) for l in mesh.loops]}

scene=bpy.data.scenes.new('REIMPORTED_GLB_CHECK')
bpy.context.window.scene=scene
bpy.ops.import_scene.gltf(filepath=os.path.join(OUT,'sergeenee_surface_refined_repaired.glb'))
report={'objects':[]}
meshes=[o for o in scene.objects if o.type=='MESH']
assert len(meshes)==15,len(meshes)
for obj in meshes:
    # The exporter adds numeric suffixes while source objects still exist.
    base=re.sub(r'(\.\d+)+$','',obj.name)
    candidates=[n for n in source if re.sub(r'(\.\d+)+$','',n)==base]
    imported_points=[obj.matrix_world@v.co for v in obj.data.vertices]
    def bounds(points):return [min(p[a] for p in points) for a in range(3)]+[max(p[a] for p in points) for a in range(3)]
    imported_bounds=bounds(imported_points)
    name=min(candidates,key=lambda n:sum((a-b)**2 for a,b in zip(imported_bounds,bounds(source[n]['points']))))
    pts=source[name]['points'];tree=kdtree.KDTree(len(pts))
    for i,p in enumerate(pts):tree.insert(p,i)
    tree.balance()
    points=[obj.matrix_world@v.co for v in obj.data.vertices]
    delta=max(tree.find(p)[2] for p in points)
    inverse=kdtree.KDTree(len(points))
    for i,p in enumerate(points):inverse.insert(p,i)
    inverse.balance()
    reverse=max(inverse.find(p)[2] for p in pts)
    # Match each imported corner to original UVs at that position.
    uv_by_vertex=[[] for _ in pts]
    for p,uv in source[name]['uvs']:uv_by_vertex[tree.find(p)[1]].append(uv)
    uv_delta=0
    for loop in obj.data.loops:
        point=obj.matrix_world@obj.data.vertices[loop.vertex_index].co
        uv=obj.data.uv_layers.active.data[loop.index].uv
        uv_delta=max(uv_delta,min((uv-original).length for original in uv_by_vertex[tree.find(point)[1]]))
    assert delta<1e-7 and reverse<1e-7,(name,delta,reverse)
    assert uv_delta<1e-6,(name,uv_delta)
    report['objects'].append({'source':name,'imported':obj.name,'max_vertex_error_m':delta,'max_reverse_vertex_error_m':reverse,'max_uv_error':uv_delta})

points=[o.matrix_world@v.co for o in meshes for v in o.data.vertices]
lo=Vector(tuple(min(p[a] for p in points) for a in range(3)))
hi=Vector(tuple(max(p[a] for p in points) for a in range(3)))
report['dimensions_blender_m']=list(hi-lo)
with open(os.path.join(EVIDENCE,'reimport.json'),'w') as f:json.dump(report,f,indent=2)
scene.render.engine='CYCLES';scene.cycles.samples=12
scene.render.resolution_x=900;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.world=bpy.data.worlds.new('Neutral inspection world');scene.world.use_nodes=True
background=next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND')
background.inputs['Color'].default_value=(.65,.65,.65,1);background.inputs['Strength'].default_value=.6
center=(lo+hi)/2
camera_data=bpy.data.cameras.new('Reimport camera');camera=bpy.data.objects.new('Reimport camera',camera_data)
scene.collection.objects.link(camera);scene.camera=camera
camera_data.type='ORTHO';camera_data.ortho_scale=.235;camera_data.clip_start=.001
for name,location,power,size in [('Key',(-.15,-.25,.32),10,.22),('Fill',(.18,-.1,.16),4,.16),('Back',(.1,.22,.28),8,.18)]:
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.shape='DISK';data.size=size
    light=bpy.data.objects.new(name,data);scene.collection.objects.link(light);light.location=location
    light.rotation_euler=(center-light.location).to_track_quat('-Z','Y').to_euler()
for view,position in [('front',(0,-.5,center.z)),('back',(0,.5,center.z))]:
    camera.location=position;camera.rotation_euler=(center-camera.location).to_track_quat('-Z','Y').to_euler()
    scene.render.filepath=os.path.join(EVIDENCE,'reimport_blender_'+view+'.png')
    bpy.ops.render.render(write_still=True)
print('REIMPORT_GEOMETRY_UV_CHECK_PASSED',json.dumps(report),flush=True)
