//https://threejs.org/docs/index.html#manual/en/introduction/How-to-run-things-locally
import {Ray} from '@dimforge/rapier3d';
import * as THREE from 'three';
import {Vector3} from 'three';
import {PointerLockControls} from 'three/examples/jsm/controls/PointerLockControls'

import('@dimforge/rapier3d').then(R=> {

const width = window.innerWidth;
const height = window.innerHeight;
const clock = new THREE.Clock();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 60, width / height, 0.01, 100 );
camera.position.y = 1;

//render setup
const renderer = new THREE.WebGLRenderer();
renderer.setSize( document.body.clientWidth, window.innerHeight );
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap;

let prevTime = performance.now();

//controls 
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const controls = new PointerLockControls(camera,document.body);
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = false;
document.body.addEventListener('click',function () {controls.lock()})
scene.add(controls.getObject())
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
            if ( canJump === true ) velocity.y += 350;
            canJump = false;
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

// Resize to the size of the screen
window.addEventListener('resize', function() {
    var width = document.body.clientWidth;
    var height = window.innerHeight;
    renderer.setSize( width, height );
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

});

//world 
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
world.createCollider(colDesc,ridgeBody)
ridgeBody.resetForces(true);

//world Vector 
const dir = new Vector3(0.0,0.0,0.0)
let ray:Ray;
let rayD = {
        x:camera.getWorldDirection(dir).x,
        y:camera.getWorldDirection(dir).y,
        z:camera.getWorldDirection(dir).z
}

//raycasting 
document.addEventListener('mousedown', function(e){
    rayD = {
            x:camera.getWorldDirection(dir).x,
            y:camera.getWorldDirection(dir).y,
            z:camera.getWorldDirection(dir).z
    }
    let {x:Px,y:Py,z:Pz} = camera.position
    ray = new R.Ray({x:Px,y:Py,z:Pz},{...rayD})
    
})

//inital render 
renderer.render( scene, camera );

( function anim () {
	requestAnimationFrame( anim );
    world.step()//move physics 

    const time = performance.now();
    //movment 
    if(controls.isLocked){
        const moveSpeed = 200.0;
        const jumpheight = 150.0;
        const delta = ( time - prevTime ) / 1000;
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
        velocity.y -= 9.8 * jumpheight * delta;

        direction.z = Number( moveForward ) - Number( moveBackward );
        direction.x = Number( moveRight ) - Number( moveLeft );
        direction.normalize(); 
        if ( moveForward || moveBackward ) velocity.z -= direction.z * moveSpeed * delta;
        if ( moveLeft || moveRight ) velocity.x -= direction.x * moveSpeed * delta;
        controls.moveRight( - velocity.x * delta );
        controls.moveForward( - velocity.z * delta );
        controls.getObject().position.y += ( velocity.y * delta );
        if ( controls.getObject().position.y < 1 ) {
            velocity.y = 0;
            controls.getObject().position.y = 1;
            canJump = true;
        }
    }
    
    //shots fired 
    if(ray){
        let hit = world.castRay(ray, 200, true);
        if(hit != null ){

            let hitPoint = ray.pointAt(hit.toi); 
            if (hit.collider.parent()){
            console.log("working", hitPoint,"handle",hit.collider.parent().handle);
            hit.collider.parent().applyImpulseAtPoint(
                    {x:0.0,y:500.0,z:0.0},
                    {...hitPoint},
            true)
            }
        }
        ray = undefined;
    }

    //physics 
    let newPos = ridgeBody.translation();
    mesh.position.set(newPos.x,newPos.y,newPos.z);
    
    prevTime = time;
    renderer.render( scene, camera );
} )();

})
/*
    function onKeyDown({keyCode} :{keyCode:number}) {
        switch (keyCode){
            case 38:
            case 87:
                moveForward = true;
                console.log("onKeyDown! moveForward is now: " + moveForward)
                break;
        }
    }
    function onKeyUp({keyCode} :{keyCode:number}) {
        switch (keyCode){
            case 38:
            case 87:
                moveForward = false;
                console.log("onKeyup! moveForward is now: " + moveForward)
                break;
        }
    }
    window.addEventListener("keydown",({key})=>{
        switch(key) {
            case "w":
            case "ArrowUp":
                camera.position.addScaledVector(y, movment)
                console.log('up')
                break;
            case "s":
            case "ArrowDown":
                camera.position.addScaledVector(y, -1*movment)
                console.log('Down')
                break;
            case "d":
            case "ArrowRight":
                camera.position.addScaledVector(x, movment)
                console.log('right')
                break;
            case "a":
            case "ArrowLeft":
                camera.position.addScaledVector(x, -1*movment)
                console.log('left')
                break;
        }
        renderer.render(scene, camera);
    } )
    */
    /*
    so all objectes auto update there scene
    you can access their info via the geometry property

    the projection matrix needs to be chnaged each time you move 
    so something like 
        camera.aspect = window.innerWidth/window.innerHeight
        camera.updateProjectionMatrix();
*/
