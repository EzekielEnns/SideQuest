//https://threejs.org/docs/index.html#manual/en/introduction/How-to-run-things-locally
import {Collider, ColliderDesc, Ray, RayColliderToi, RigidBody, RigidBodyDesc} from '@dimforge/rapier3d';
import * as THREE from 'three';
import {BufferGeometry, Camera, CircleGeometry, Euler, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, Vector3} from 'three';
import {PointerLockControls} from 'three/examples/jsm/controls/PointerLockControls'

import('@dimforge/rapier3d').then(R=> {

//BOILERPLATE
const width = window.innerWidth;
const height = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 60, width / height, 0.01, 100 ); 
//
//render setup
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize( document.body.clientWidth, window.innerHeight );
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;
window.addEventListener('resize', function() {
    var width = document.body.clientWidth;
    var height = window.innerHeight;
    renderer.setSize( width, height );
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});

///controls
const controls = new PointerLockControls(camera,document.body);
scene.add(controls.getObject())
document.body.addEventListener('click',function () {controls.lock()})

const gridHelper = new THREE.GridHelper( 100, 100 );
gridHelper.position.y = 0;
scene.add( gridHelper );
let gravity = {x:0.0, y:-9.81, z:0.0}
let world = new R.World(gravity)
let groundColDesc = R.ColliderDesc.cuboid(50.0, 0.1, 50.0)
                      .setFriction(0.6)
world.createCollider(groundColDesc)

interface bVec {x:number,y:number,z:number}
class Entity{
    public threeHost:Mesh|Camera
    public body:RigidBody
    public collider:Collider
    private pos:Vector3
    
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
}

///meshes
const cSize = 2;

const boxyBoi = new Entity(
    new Vector3(0,5,-10),
    new THREE.Mesh(
        new THREE.BoxGeometry( cSize, cSize, cSize ),
        new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: false} )
    ),
    R.RigidBodyDesc.dynamic()
            .setAdditionalMass(100.0),
    R.ColliderDesc.cuboid(cSize/2, cSize/2, cSize/2),
)

const player = new Entity(
    new Vector3(0,1,0),
    controls.getObject(),
    R.RigidBodyDesc.dynamic()
            .setLinearDamping(11.0)
            .setAngularDamping(11.0)
            .setAdditionalMass(100.0),
    R.ColliderDesc.cuboid(1, 1, 1)
);

//Shooting
//world Vector 
//TODO make the vector roate with player
//
const lineEnd = new Mesh(new CircleGeometry(1,1,1),new MeshBasicMaterial({color:0xff00ff,wireframe:true}))
scene.add(lineEnd)
document.addEventListener('mousedown', function(e){

    let origin:{x:number,y:number,z:number}= player.getPos().clone();
    let dir = new Vector3();
    player.threeHost.getWorldDirection(dir);
    let realD:{x:number,y:number,z:number}= dir.clone()
    let ray = new R.Ray(origin,realD)  

    const distance = 5;
    let pos = new Vector3();
    pos.copy(dir);
    pos.multiplyScalar(distance)
    lineEnd.position.set(pos.x,pos.y,pos.z)
    lineEnd.setRotationFromEuler(player.threeHost.rotation)

    //TODO set dir to player look
    //sets ray center of screen 
    //TODO add is lock option
    /*
    dir.multiplyScalar(-1)
    if (line instanceof Line){
        scene.remove(line)
    }
    let  end = orign.clone();
    end.addScaledVector(new Vector3(0,0,1), 10)
    let realRot = player.threeHost.rotation.clone();
    realRot.set(-1*realRot.x, -1*realRot.y, -1*realRot.z)
    end.applyEuler(realRot)
    line  = new Line(lineGeo,material)
    if (line instanceof Line){
        console.log('origin:',orign,'end:',end )
        console.log('rotation:',player.threeHost.rotation,'world dir :',dir)
        scene.add(line)
    }
    if (lineEnd instanceof Mesh){
    lineEnd.position.set(end.x,end.y,end.z)
        scene.add(lineEnd)
    }

    //Next thing to take on shoots fired 
    */

    /*
    console.log('origin:',player.getPos(),' dir:',dir )
    let ray = new R.Ray({x:Px,y:Py,z:Pz},dir)
    let hit = player.collider.castRay(ray, 200, true);
    if(hit == boxyBoi.body.handle){
        boxyBoi.body.applyImpulse(
                {x:0.0,y:500.0,z:0.0},
        true)
        }
        */
}
)
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
            //TODO cast
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
});

//inital render 
renderer.render( scene, camera );

( function anim () {
	requestAnimationFrame( anim );

    world.step()//keep out of is locked TODO find out 
    if(controls.isLocked){
       //TODO move this to movemnt function
       const moveSpeed = 10.0;
       let rotate = controls.getObject().rotation;
       const direction = new THREE.Vector3();
       
       direction.z = -1*(Number( moveForward ) - Number( moveBackward ))*moveSpeed;
       direction.x = (Number( moveRight ) - Number( moveLeft ))*moveSpeed;
       direction.applyEuler(rotate)
       direction.multiplyScalar(moveSpeed) 
       player.body.applyImpulse({x:direction.x,y:0.0,z:direction.z }, true)

       player.getPos();
       boxyBoi.getPos();
    }


    
    renderer.render( scene, camera );
} )();

})
