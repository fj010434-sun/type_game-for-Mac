import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createWardrobeCharacter, applyOutfit, loadWardrobeAssets } from './wardrobe-character.js';
export class WardrobePreview {
 constructor(canvas){
  this.canvas=canvas;this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0xeaf1f5);
  this.scene.add(new THREE.HemisphereLight(0xffffff,0x8495a9,2.3));
  const sun=new THREE.DirectionalLight(0xffeed7,2.5);sun.position.set(-3,5,4);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.normalBias=.035;sun.shadow.bias=-.0002;Object.assign(sun.shadow.camera,{left:-2,right:2,top:3,bottom:-1,near:.1,far:12});this.scene.add(sun);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(1.2,48),new THREE.MeshLambertMaterial({color:0xd5e0e7}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.015;floor.receiveShadow=true;this.scene.add(floor);
  this.camera=new THREE.PerspectiveCamera(36,1,.1,20);this.angle=.15;this.closeup=false;this.animation='idle';this.running=false;
  this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(canvas);this.resize();
 }
 async load(outfit){
  await loadWardrobeAssets();const gltf=await new GLTFLoader().loadAsync('assets/characters/character-male-c.glb');
  this.character=createWardrobeCharacter(gltf,outfit);this.character.model.rotation.y=0;this.scene.add(this.character.root);this.animate('idle');this.render(0);
 }
 setOutfit(outfit){applyOutfit(this.character,outfit);this.render(0);}
 animate(name){this.animation=name;for(const action of Object.values(this.character.actions))action.stop();this.character.actions[name]?.reset().play();}
 resize(){const r=this.canvas.getBoundingClientRect();if(r.width<1||r.height<1)return;this.renderer.setSize(r.width,r.height,false);this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix();if(this.character)this.render(0);}
 render(dt){if(!this.character)return;this.character.mixer.update(dt);this.character.root.rotation.y=this.angle;
  this.camera.position.set(0,this.closeup?1.28:1.15,this.closeup?2.45:3.9);this.camera.lookAt(0,this.closeup?1.25:.9,0);this.renderer.render(this.scene,this.camera);
 }
 start(){if(this.running)return;this.running=true;this.last=performance.now();const frame=now=>{if(!this.running)return;this.render(Math.min(.05,(now-this.last)/1000));this.last=now;this.raf=requestAnimationFrame(frame);};this.raf=requestAnimationFrame(frame);this.resize();}
 stop(){this.running=false;cancelAnimationFrame(this.raf);}
 dispose(){this.stop();this.observer.disconnect();this.character?.dispose();this.scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();if(!o.isSkinnedMesh)o.material.dispose();}});this.renderer.dispose();}
}
