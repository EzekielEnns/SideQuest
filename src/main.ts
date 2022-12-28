//https://threejs.org/docs/index.html#manual/en/introduction/How-to-run-things-locally
import * as THREE from 'three';
import {Mesh, PerspectiveCamera, Scene, WebGLRenderer} from 'three';

var scene:Scene, camera:PerspectiveCamera, renderer:WebGLRenderer, mesh: Mesh;
var meshFloor:Mesh, wall:Mesh;

var keyboard:any = {};
var player = { height: 1.8, speed: 0.1, turnSpeed: Math.PI * 0.02 };
var mouse:MouseEvent = null;
window.addEventListener("mousemove",(e:MouseEvent)=>{ mouse = e;})

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera( 75, document.body.clientWidth / window.innerHeight, 0.1, 1000 );
    scene.background = new THREE.Color( 0xc9c9c9 );

    // Polygons
    mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1,1,1),
        new THREE.MeshPhongMaterial({color: 0xff3333, wireframe: false})
    );

    mesh.position.set(0, 1.25, 0);
    mesh.receiveShadow = true;
    mesh.castShadow = true;

    scene.add(mesh);

    meshFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(60,60,10,10),
        new THREE.MeshPhongMaterial({color:0xffffff, wireframe: false})
    );

    meshFloor.rotation.x -= Math.PI / 2;
    meshFloor.receiveShadow = true;
    mesh.castShadow = true;

    scene.add(meshFloor);


    wall = new THREE.Mesh(

        new THREE.PlaneGeometry(100,70,10,10),
        new THREE.MeshPhongMaterial({color: 0x59b9e1, wireframe: false})


        );

    wall.receiveShadow = true;
    wall.position.set(0,0,-20);
    mesh.castShadow = true;
    scene.add(wall);


    // Camera

    camera.position.set(0, player.height, 3);
    camera.lookAt(new THREE.Vector3(0, player.height, 0));



    // Lighting
    var light = new THREE.PointLight( 0xffffff, 1.3, 50, 2 );
    light.position.set( -10, 20, 12 );
    scene.add( light );

    var light2 = new THREE.PointLight( 0xffffff, 1.3, 50, 2 );
    light2.position.set( 10, 20, 12 );
    scene.add( light2 );

    var spotLight = new THREE.SpotLight( 0xffffff, 0.1 );
    spotLight.position.set( 10, 80, 10 );
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 500;
    spotLight.shadow.mapSize.height = 500;
    spotLight.shadow.camera.near = .25;
    spotLight.shadow.camera.far = 1000;
    spotLight.shadow.camera.fov = 3;
    scene.add( spotLight );


    var sphereSize = 1;
    var spotLightHelper = new THREE.SpotLightHelper( spotLight, sphereSize );
    scene.add( spotLightHelper );

    var pointLightHelper2 = new THREE.PointLightHelper( light2, sphereSize );
    scene.add( pointLightHelper2 );

    var pointLightHelper = new THREE.PointLightHelper( light, sphereSize );
    scene.add( pointLightHelper );


    // Render 
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( document.body.clientWidth, window.innerHeight );
    document.body.appendChild(renderer.domElement);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.BasicShadowMap;

    // Resize to the size of the screen
    window.addEventListener('resize', function() {

        var width = document.body.clientWidth;
        var height = window.innerHeight;
        renderer.setSize( width, height );
        camera.aspect = width / height;
        camera.updateProjectionMatrix();

    });

    animate();

}
function animate() {

    requestAnimationFrame(animate);

    mesh.rotation.x += 0.01;
    mesh.rotation.y += 0.02;

    renderer.render(scene, camera);


    if (keyboard[87]) { // W key

        camera.position.y += Math.sin(camera.rotation.y) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y) * player.speed;
    }

    if (keyboard[83]) { // S key

        camera.position.y += Math.sin(camera.rotation.y) * player.speed;
        camera.position.z += Math.cos(camera.rotation.y) * player.speed;
    }

    if (keyboard[65]) { // A key
    

        camera.position.x -= Math.sin(camera.rotation.y + Math.PI/2) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y + Math.PI/2) * player.speed;
    }

    if (keyboard[68]) { // D key
        camera.position.x -= Math.sin(camera.rotation.y - Math.PI/2) * player.speed;
        camera.position.z += -Math.cos(camera.rotation.y - Math.PI/2) * player.speed;
    }
    //TODO a matrix rotation on perspective camera along the y access
    if (keyboard[37]) { // left arrow key
        camera.rotation.y += player.turnSpeed;
    }
    if (keyboard[39]) { // right arrow key
        camera.rotation.y -= player.turnSpeed;
    }



}

function keyDown({keyCode} : {keyCode:number}) {

    keyboard[keyCode] = true;

}

function keyUp({keyCode} : {keyCode:number}) {

    keyboard[keyCode] = false;

}

window.addEventListener('keydown', keyDown);
window.addEventListener('keyup', keyUp);


window.onload = init;

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
