//https://threejs.org/docs/index.html#manual/en/introduction/How-to-run-things-locally
import {Ray, RayColliderToi} from '@dimforge/rapier3d';
import * as THREE from 'three';
import {Vector3} from 'three';
import {PointerLockControls} from 'three/examples/jsm/controls/PointerLockControls'

import('@dimforge/rapier3d').then(R=> {

//BOILERPLATE
const width = window.innerWidth;
const height = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 60, width / height, 0.01, 100 ); 
camera.position.y = 1;
//render setup
const renderer = new THREE.WebGLRenderer();
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


///meshes
const cSize = 2;
const mesh = new THREE.Mesh(
	new THREE.BoxGeometry( cSize, cSize, cSize ),
	new THREE.MeshBasicMaterial( { color: 0xff0000, wireframe: false} )
);
mesh.position.z = -10;
mesh.position.y = 5;
scene.add( mesh );
const gridHelper = new THREE.GridHelper( 100, 100 );
gridHelper.position.y = 0;
scene.add( gridHelper );

//physics 
//TODO rename vars
let gravity = {x:0.0, y:-9.81, z:0.0}
let world = new R.World(gravity)
let groundColDesc = R.ColliderDesc.cuboid(50.0, 0.1, 50.0)
                      .setFriction(0.6)
world.createCollider(groundColDesc)
let ridgeBodydesc = R.RigidBodyDesc.dynamic()
            .setTranslation(mesh.position.x,mesh.position.y,mesh.position.z)
            .setAdditionalMass(100.0)
let ridgeBody = world.createRigidBody(ridgeBodydesc);
let colDesc = R.ColliderDesc.cuboid(cSize/2, cSize/2, cSize/2)
let test = world.createCollider(colDesc,ridgeBody)
ridgeBody.resetForces(true);
let playerBody = R.RigidBodyDesc.dynamic()
                    .setLinearDamping(11.0)
                    .setAngularDamping(11.0)
                    .setTranslation(camera.position.x, camera.position.y, camera.position.z)
                    .setAdditionalMass(100.0)
let playerCol = R.ColliderDesc.cuboid(1, 1, 1)
let player = world.createRigidBody(playerBody)
let plr = world.createCollider(playerCol,player)

//Shooting
//world Vector 
const dir = new Vector3(0.0,0.0,0.0)
let rayD = {
        x:camera.getWorldDirection(dir).x,
        y:camera.getWorldDirection(dir).y,
        z:camera.getWorldDirection(dir).z
}
let hit:unknown;
document.addEventListener('mousedown', function(e){
    //TODO set dir to player look
    //sets ray center of screen 
    //TODO add is lock option
    rayD = {
            x:camera.getWorldDirection(dir).x,
            y:camera.getWorldDirection(dir).y,
            z:camera.getWorldDirection(dir).z
    }
    let {x:Px,y:Py,z:Pz} = camera.position
    //Next thing to take on shoots fired 
    let ray = new R.Ray({x:Px,y:Py,z:Pz},{...rayD})
    let hit = plr.castRay(ray, 200, true);
    if(hit == ridgeBody.handle){
        console.log("shots fired")
        if (test.parent()){
        test.parent().applyImpulse(
                {x:0.0,y:500.0,z:0.0},
        true)
        }
    }
})
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
       //TODO clean up this math
       direction.z = -1*(Number( moveForward ) - Number( moveBackward ))*moveSpeed;
       direction.x = (Number( moveRight ) - Number( moveLeft ))*moveSpeed;
       direction.applyEuler(rotate)
       direction.multiplyScalar(moveSpeed) 
       player.applyImpulse({x:direction.x,y:0.0,z:direction.z }, true)

       //aligning bodies TODO abstract this
       let rlPos = player.translation();
       controls.getObject().position.set(rlPos.x,rlPos.y,rlPos.z)
       let newPos = ridgeBody.translation();
       mesh.position.set(newPos.x,newPos.y,newPos.z);
    }


    
    renderer.render( scene, camera );
} )();

})
