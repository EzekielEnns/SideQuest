//https://threejs.org/docs/index.html#manual/en/introduction/How-to-run-things-locally
import {Collider, ColliderDesc, RayColliderToi, Ray, RigidBody, RigidBodyDesc} from '@dimforge/rapier3d';
import * as THREE from 'three';
import {BufferGeometry, Camera,  Mesh, MeshBasicMaterial, Vector, Vector3} from 'three';
import {PointerLockControls} from 'three/examples/jsm/controls/PointerLockControls'

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
    private effect:Vector3[] = [];
    
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
    public addImpulse(f:Vector3){ this.effect.push(f) }
    public applyImpulses(){
        this.effect.forEach((f)=>{
            this.body.applyImpulse(f, true)
        })
        this.effect = [];
    }
}

const cSize = 3;
const boxyBoi = new Entity(
    new Vector3(0,5,-10),
    new THREE.Mesh(
        new THREE.BoxGeometry( cSize, cSize, cSize ),
        new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: false} )
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

//this is to make our effects thread safe 
const entites:Map<number,Entity> = new Map();
entites.set(player.collider.handle,player)
entites.set(boxyBoi.collider.handle,boxyBoi)

//Shooting / effects 
document.addEventListener('mousedown', function(e){
    //shooting ray
    let origin = player.getPos();
    let dir = new Vector3();
    player.threeHost.getWorldDirection(dir);
    let ray = new R.Ray(origin,dir)  

    let hit = world.castRay(ray, 100, true,undefined,undefined,undefined,player.body)
    if(!hit)return
    let rot ={ w: 1.0, x: 0.0, y: 0.0, z: 0.0 }; 
    let pos = ray.pointAt(hit.toi)
    let shape = new R.Cuboid(10.0, 10.0, 10.0)

    function area(c:Collider):boolean{
        let test = entites.get(c.handle);
        if(test){ test.addImpulse(new Vector3(0,100,0)) }
        return true;
    }
    world.intersectionsWithShape(pos, rot, shape,area)
    
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
            applyToPlayerSelf(new Vector3(0,100,0))
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

//effects 


//inital render 
renderer.render( scene, camera );

( function gameLoop () {
	requestAnimationFrame( gameLoop );
    
    if(controls.isLocked){
        const moveSpeed = 5;
        entites.forEach((e)=> e.applyImpulses())
        addMovementAndUpdate(moveSpeed)
        boxyBoi.getPos();
        world.step();
    }


    
    renderer.render( scene, camera );
} )();

})


/* spell cirlces?
    const shape = new THREE.Shape();
    shape.moveTo(0, 10);
    shape.absarc(0, 0, 1, 0, Math.PI * 2, false);
    const circleGeometry = new THREE.ShapeGeometry(shape);
    const circleMaterial = new THREE.LineBasicMaterial({color:0xfffff00})
    const circle = new THREE.Line(circleGeometry, circleMaterial);
    scene.add(circle)

    //in function
    //draw circle
    const distance = 3;
    let pos = new Vector3();
    pos.copy(dir);
    pos.multiplyScalar(distance);
    pos.add(origin);
    circle.position.set(pos.x,pos.y,pos.z);
    circle.setRotationFromEuler(player.threeHost.rotation);
*/
