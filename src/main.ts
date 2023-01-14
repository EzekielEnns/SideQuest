//https://threejs.org/docs/index.html#manual/en/introduction/How-to-run-things-locally
import {Collider, ColliderDesc, RayColliderToi, Ray, Vector,RigidBody, RigidBodyDesc, Shape} from '@dimforge/rapier3d';
import * as THREE from 'three';
import {BufferGeometry, Camera,  Mesh, MeshBasicMaterial, Vector3} from 'three';
import {PointerLockControls} from 'three/examples/jsm/controls/PointerLockControls'
import {Line2} from 'three/examples/jsm/lines/Line2';
import {LineGeometry} from 'three/examples/jsm/lines/LineGeometry';
import {LineMaterial} from 'three/examples/jsm/lines/LineMaterial';

import('@dimforge/rapier3d').then(R=> {

//BOILERPLATE
const width = window.innerWidth;
const height = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 60, width / height, 0.01, 100 ); 
const clock = new THREE.Clock(); //used for getting movement 

//render setup
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize( document.body.clientWidth, window.innerHeight );
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
//hookups 
window.addEventListener('resize', function() {
    const left = (window.innerWidth - crossHair.offsetWidth) / 2;
    const top = (window.innerHeight - crossHair.offsetHeight) / 2;
    crossHair.style.left = `${left}px`;
    crossHair.style.top = `${top}px`;
    var width = document.body.clientWidth;
    var height = window.innerHeight;
    renderer.setSize( width, height );
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});
const controls = new PointerLockControls(camera,document.body);
scene.add(controls.getObject())
document.body.addEventListener('click',function () {controls.lock()})

let crossHair = document.createElement('text')
crossHair.textContent = '◎'
crossHair.style.color = 'white'
const left = (window.innerWidth - crossHair.offsetWidth) / 2;
const top = (window.innerHeight - crossHair.offsetHeight) / 2;
crossHair.style.left = `${left}px`;
crossHair.style.top = `${top}px`;
crossHair.style.userSelect = 'none';
crossHair.style.position = 'absolute'
crossHair.style.fontSize = '1.4em'
document.body.appendChild(crossHair)


//world plame
const gridHelper = new THREE.GridHelper( 100, 100 );
gridHelper.position.y = 0;
scene.add( gridHelper );

//world phyicis 
let gravity = {x:0.0, y:-9.81, z:0.0}
let world = new R.World(gravity)
let groundColDesc = R.ColliderDesc.cuboid(50.0, 0.1, 50.0)
world.createCollider(groundColDesc)

class Entity{
    public threeHost:Mesh|Camera
    public body:RigidBody
    public collider:Collider
    private pos:Vector3
    private effect:Effect[] = [];
    
    constructor(pos:Vector3,host:Mesh|Camera,bodyDesc:RigidBodyDesc,collDesc:ColliderDesc) {
        this.pos = pos
        host.position.set(pos.x,pos.y,pos.z)
        bodyDesc.setTranslation(this.pos.x,this.pos.y,this.pos.z);
        this.threeHost = host
        this.body = world.createRigidBody(bodyDesc);
        this.collider = world.createCollider(collDesc,this.body);
        if (host instanceof Mesh){ scene.add(host) }
    }

    public getPos():Vector3{
        this.pos.setX(this.body.translation().x);
        this.pos.setY(this.body.translation().y);
        this.pos.setZ(this.body.translation().z);
        this.threeHost.position.set(this.pos.x,this.pos.y,this.pos.z)
        return this.pos;
    }

    public updatePos(v:Vector3):Vector3{
        player.body.setTranslation(v,true)
        return this.getPos();
    }

    public addEffect(e:Effect){ this.effect.push(e)}
    public applyEffects(){
        this.effect.forEach((e)=>e.onHit(this))
        this.effect = [];
    }
}

const cSize = 3;
const boxyBoi = new Entity(
    new Vector3(0,5,-10),
    new THREE.Mesh(
        new THREE.BoxGeometry( cSize, cSize, cSize ),
        new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe:true} )
    ),
    R.RigidBodyDesc.dynamic()
            .setAdditionalMass(10.0),
    R.ColliderDesc.cuboid(cSize/2, cSize/2, cSize/2),
)
const player = new Entity(
    new Vector3(0,1,0),
    controls.getObject(),
    R.RigidBodyDesc.dynamic()
            .setAdditionalMass(10.0),
    R.ColliderDesc.cuboid(1, 1, 1)
);

const getEffectMesh =()=>( new THREE.Mesh( 
        new THREE.BoxGeometry( 10,10,10 ),
        new THREE.MeshBasicMaterial( { color: 0x0000FF, wireframe:true} )
))

//this is to make our effects thread safe 
const entites:Map<number,Entity> = new Map();
entites.set(player.collider.handle,player)
entites.set(boxyBoi.collider.handle,boxyBoi)

interface Effect{
    shape:Shape,
    life:number,
    onHit:(e:Entity)=>void
}

const getWind = ():Effect => ({
    shape:new R.Cuboid(5,5,5),
    life:10,
    onHit:(e:Entity)=>{
        //alert(`${e.body.handle}`)
        e.body.applyImpulse({x:0,y:5,z:0}, true)
    }
});

//const effects
const effects:Map<Vector,Effect> = new Map();

const rot = { w: 1.0, x: 0.0, y: 0.0, z: 0.0 };
//line basics 
const rayMaterial = new THREE.LineBasicMaterial( { color: 0x00FA9A, linewidth: 5, } );
const rayGeo = new THREE.BufferGeometry();
const rayLine = new THREE.Line(rayGeo,rayMaterial);
//Shooting / effects 
document.addEventListener('mousedown', function(e){
    scene.remove(rayLine)
    //shooting ray
    let origin = player.getPos();
    let dir = new Vector3();
    player.threeHost.getWorldDirection(dir);
    let ray = new R.Ray(origin,dir)  
    let toi= 100
    let hit = world.castRay(ray, toi, true,undefined,undefined,undefined,player.body)

    if(hit){
        let pos = ray.pointAt(hit.toi)
        rayGeo.setFromPoints([origin,new Vector3(pos.x,pos.y,pos.z)])
        effects.set(pos, getWind())
    }
    else{
        let pos = new Vector3();
        pos.add(dir);
        pos.multiplyScalar(toi);
        pos.add(origin);
        rayGeo.setFromPoints([origin,new Vector3(pos.x,pos.y,pos.z)])
        effects.set(pos, getWind())
    }
    scene.add(rayLine)
})

/* Applys a force rotated based on where the player is looking 
 * */
function applyToPlayerSelf(force:Vector3){
    const rlF = force.clone();
    rlF.applyEuler(player.threeHost.rotation)
    player.body.applyImpulse({x:rlF.x,y:rlF.y,z:rlF.z}, true)
}

//Controls 
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
document.addEventListener('keydown', function ({code}){
    switch ( code ) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;

        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;

        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            player.body.applyImpulse({x:0,y:100,z:0}, true)
            break;
    }
})
document.addEventListener('keyup', function({code}){
    switch ( code ) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;

        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;

        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;

        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
    }
})

function addMovementAndUpdate(moveSpeed:number){
    let dir = new Vector3(
        (Number( moveRight ) - Number( moveLeft )),
        0.0,
        (Number( moveBackward ) - Number( moveForward ))
    );
    dir.multiplyScalar(moveSpeed)

    dir.applyEuler(player.threeHost.rotation)
    dir.setY(0)
    let elapsed = clock.getDelta()
    dir.multiplyScalar(elapsed);
    dir.add(player.getPos())
    player.updatePos(dir)
}

function addMovementAndUpdateImpulse(moveSpeed:number){
    let dir = new Vector3(
        (Number( moveRight ) - Number( moveLeft )),
        0.0,
        (Number( moveBackward ) - Number( moveForward ))
    );
    dir.multiplyScalar(moveSpeed)
    dir.applyEuler(player.threeHost.rotation)
    player.body.applyImpulse({x:dir.x,y:0,z:dir.z}, true)
    player.getPos();
}

//effects 

let last = performance.now();

//inital render 
renderer.render( scene, camera );

( function gameLoop () {
	requestAnimationFrame( gameLoop );
    
    if(controls.isLocked){
        const moveSpeed = 5;

        effects.forEach((e,p)=>{
            world.intersectionsWithShape(p, rot, e.shape,(c:Collider)=>{
                if (e.life){
                    let mesh = getEffectMesh();
                    mesh.position.set(p.x,p.y,p.z);
                    scene.add(mesh)
                }
                e.life = 0;
                let test = entites.get(c.handle);
                if(test){ test.addEffect(e) }
                return true;
            })
        })
        
        entites.forEach((daddy)=>daddy.applyEffects())
        addMovementAndUpdate(moveSpeed)
        boxyBoi.getPos();
        world.step();
    }


    
    renderer.render( scene, camera );
} )();

})

