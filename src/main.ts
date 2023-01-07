//https://threejs.org/docs/index.html#manual/en/introduction/How-to-run-things-locally
import {Collider, ColliderDesc, RigidBody, RigidBodyDesc} from '@dimforge/rapier3d';
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
                      .setTranslation(0,0,0)
world.createCollider(groundColDesc)

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
const cSize = 3;

const boxyBoi = new Entity(
    new Vector3(0,5,-10),
    new THREE.Mesh(
        new THREE.BoxGeometry( cSize, cSize, cSize ),
        new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: true} )
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
const circleGeometry = new THREE.CircleGeometry(1, 2);
const circleMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe:true });
const circle = new THREE.Mesh(circleGeometry, circleMaterial);
scene.add(circle)
document.addEventListener('mousedown', function(e){

    let pl = player.getPos().clone();
    let dir = new Vector3();
    player.threeHost.getWorldDirection(dir);

    const distance = 3;
    let pos = new Vector3();
    pos.copy(dir);
    //TODO for some reason needs to be roated as well 
    pos.multiplyScalar(distance)
    pos.add(pl);
    circle.position.set(pos.x,pos.y,pos.z)
    circle.setRotationFromEuler(player.threeHost.rotation)
    dir.applyEuler(player.threeHost.rotation)

    let ray = new R.Ray(pos,dir)  
    let hit = world.castRay(ray, 100, false)
    if(hit){
        console.log('body:',boxyBoi.body.handle,'hit:',hit.collider.handle)
        let body = hit.collider.parent()
        if (body){
            if(body.handle == player.body.handle){
                console.log(
                    'plcolider:',player.collider.translation(),
                    '\nplBody:',player.body.translation(),
                    '\nplCam:',player.threeHost.position,
                    '\npoint:',ray.pointAt(hit.toi),
                    '\ntoi:',hit.toi
                )
            }
            body.applyImpulse( {x:0.0,y:500.0,z:0.0}, true)

        }
    }



    /*
    console.log('origin:',player.getPos(),' dir:',dir )
    let ray = new R.Ray({x:Px,y:Py,z:Pz},dir)
    let hit = player.collider.castRay(ray, 200, true);
    if(hit == boxyBoi.body.handle){
        boxyBoi.body        }
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

    if(controls.isLocked){
        world.step()
        const moveSpeed = 100.0;
        let dir = new Vector3(
            //if we should be moving right set to 1 else set it to -1 
            (Number( moveRight ) - Number( moveLeft )),
            0,
            (Number( moveBackward ) - Number( moveForward ))
        );
        dir.applyEuler(player.threeHost.rotation)
        dir.multiplyScalar(moveSpeed)
        player.body.applyImpulse({x:dir.x,y:0,z:dir.z}, true)
        player.getPos();
        boxyBoi.getPos();
    }


    
    renderer.render( scene, camera );
} )();

})
