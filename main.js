import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let renderer, scene, camera;
let mesh;

init();

function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setClearColor(0x808080);
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    document.body.appendChild( renderer.domElement );
    
    scene = new THREE.Scene();
    console.log('Scene initialized.');
    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 100 );
    camera.position.set( 0, 0, 1.5 );
    console.log('Camera initialized.');
    new OrbitControls( camera, renderer.domElement );
    console.log('Orbit Controls initialized.');
    let canvas = document.createElement('canvas');

    /*// Texture
    const headArrayBuffer = fetch('head_256x256x109head_256x256x109.bin').arrayBuffer();
    const headTexture = new Uint8Array(headArrayBuffer);


    const texture = new THREE.Data3DTexture(
        headTexture, // The data values stored in the pixels of the texture.
        256, // Width of texture.
        256, // Height of texture.
        109 // Depth of texture.
      );
      
      texture.format = THREE.RedFormat; // Our texture has only one channel (red).
      texture.type = THREE.UnsignedByteType; // The data type is 8 bit unsigned integer.
      texture.minFilter = THREE.LinearFilter; // Linear filter for minification.
      texture.magFilter = THREE.LinearFilter; // Linear filter for maximization.
    
       // Repeat edge values when sampling outside of texture boundaries.
      texture.wrapS = THREE.ClampToEdgeWrapping;
      texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.wrapR = THREE.ClampToEdgeWrapping;
    
      // Mark texture for update so that the changes take effect.
      texture.needsUpdate = true;*/
      
    // Texture

    const size = 256;
    const data = new Float32Array( 4 * (size + 1) * size * size );

    let i = 0;
    const scale = 0.05;
    const vector = new THREE.Vector3();

    // Define custom radius of sphere.
    const radius = size / 2;
    let curr_radius = 0;
    const sliceStep = 1;

    for ( let z = 0; z <= size ; z += (sliceStep) ) {
        let coordn_z = z - (size / 2);
        curr_radius = Math.sqrt(radius ** 2 - coordn_z ** 2);
        console.log("Slice #" + z + ", curr_radius: " + curr_radius + ", coordn_z: " + coordn_z);
        //let slice = new Uint8Array(size * size);
        for ( let y = 0; y < size; y ++ ) {

            for ( let x = 0; x < size; x ++ ) {
                let coordn_x = x - (size / 2);
                let coordn_y = (size / 2) - y;
                //console.log("coordnx : " + coordn_x + ", coordny: " + coordn_y);
                if ((Math.abs((coordn_x) ** 2 + (coordn_y) ** 2) - (curr_radius ** 2)) < 0.5) {
                    if ( coordn_x > 0 ) {
                        if (coordn_y > 0) {
                            data[i] = 103 / 255;
                            data[i + 1] = 47/ 255;
                            data[i + 2] = 156 / 255;
                            data[i + 3] = 1;
                        }
                        else {
                            data[i] = 255 / 255;
                            data[i + 1] =  255 / 255;
                            data[i + 2] = 0 / 255;
                            data[i + 3] = 1; 
                        }
                    }
                    else {
                        if (coordn_y < 0) {
                            data[i] = 103 / 255;
                            data[i + 1] = 47/ 255;
                            data[i + 2] = 156 / 255;
                            data[i + 3] = 1;
                        }
                        else {
                            data[i] = 255 / 255;
                            data[i + 1] =  255 / 255;
                            data[i + 2] = 0 / 255;
                            data[i + 3] = 1; 
                        }
                    }
                
                    //console.log("coordnx : " + coordn_x + ", coordny: " + coordn_y);
                    //slice[i] = 255;
                }
                else {
                    data[i] =  128 / 255;
                    data[i+1] = 128 / 255;
                    data[i + 2] = 128 / 255;
                    data[i + 3] = 0;
                    //slice[i] = 0;
                }
                i += 4 ;
            }
        }
        i += (sliceStep - 1) * size * size;
    }
    console.log(data);

    /*i = size * size - 1;
    for ( let z = 1; z < size; z ++) {
        if (z % sliceStep != 0) {
            //console.log("averaging two slices for slice #" + z);
            //let coordn_z = z - (size / 2);
            console.log("Slice #" + z)
            let slice = new Uint8Array(size * size);
            for ( let y = 0; y < size; y ++ ) {
                for ( let x = 0; x < size; x ++ ) {
                    let dist_from_lower_slice = z % sliceStep ;
                    let dist_from_higher_slice = sliceStep - dist_from_lower_slice;
                    // Just take average of pixel value above and below
                    data[i] = (Math.max(data[i - dist_from_lower_slice * size * size], data[i + dist_from_higher_slice * size * size])) % 256;
                    //if (data[i] != 0) {console.log("data @ " + i + "= " + data[i])};
                    slice[i % (size * size)] = data[i];
                    //console.log("data[" + i + "] = " + data[i]);
                    i ++;
                }

            }
        console.log("slice #" + z + "= " + slice);
        }
        i += size * size;
        //break;
        
    } 
        */

    //console.log(data);
    const texture = new THREE.Data3DTexture( data, size, size, size + 1);
    texture.format = THREE.RGBAFormat;
    texture.type = THREE.FloatType;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.unpackAlignment = 4;
    texture.needsUpdate = true;

    // Material

    const vertexShader = /* glsl */`
        in vec3 position;

        uniform mat4 modelMatrix;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        uniform vec3 cameraPos;

        out vec3 vOrigin;
        out vec3 vDirection;

        void main() {
            vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

            vOrigin = vec3( inverse( modelMatrix ) * vec4( cameraPos, 1.0 ) ).xyz;
            vDirection = position - vOrigin;

            gl_Position = projectionMatrix * mvPosition;
        }
    `;

    const fragmentShader = /* glsl */`
        precision highp float;
        precision highp sampler3D;

        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;

        in vec3 vOrigin;
        in vec3 vDirection;

        out vec4 color;

        uniform sampler3D map;
        uniform vec3 cameraPos;
        uniform vec3 lightPos;
        uniform float lightPower;
        uniform vec3 lightColor;
        uniform float threshold;
        uniform float range;
        uniform float opacity;
        uniform float steps;
        uniform float frame;
        uniform float shadingSamplingStep;

        vec2 hitBox( vec3 orig, vec3 dir ) {
            const vec3 box_min = vec3( - 0.5 );
            const vec3 box_max = vec3( 0.5 );
            vec3 inv_dir = 1.0 / dir;
            vec3 tmin_tmp = ( box_min - orig ) * inv_dir;
            vec3 tmax_tmp = ( box_max - orig ) * inv_dir;
            vec3 tmin = min( tmin_tmp, tmax_tmp );
            vec3 tmax = max( tmin_tmp, tmax_tmp );
            float t0 = max( tmin.x, max( tmin.y, tmin.z ) );
            float t1 = min( tmax.x, min( tmax.y, tmax.z ) );
            return vec2( t0, t1 );
        }

        float sample1( vec3 p ) {
            vec3 color = texture( map, p).rgb;
            float grayscale = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
            return smoothstep(0.0, 1.0, grayscale);
        }

        float shading( vec3 coord ) {
            float step = shadingSamplingStep;
            return sample1( coord + vec3( - step ) ) - sample1( coord + vec3( step ) );
        }

        
        vec4 sample2( vec3 p ) {
            return texture( map, p );
        }

        #define epsilon .0001

        vec3 normal( vec3 coord ) {

            float step1 = 0.0001;
            float step2 = 0.0001;
            float x = sample1(sample2( coord + vec3( - step1, 0.0, 0.0 ) ).rgb - sample2( coord + vec3( step2, 0.0, 0.0 ) ).rgb);
            float y = sample1(sample2( coord + vec3( 0.0, - step2, 0.0 ) ).rgb - sample2( coord + vec3( 0.0, step1, 0.0 ) ).rgb);
            float z = sample1(sample2( coord + vec3( 0.0, 0.0, - step1 ) ).rgb - sample2( coord + vec3( 0.0, 0.0, step2 ) ).rgb);

            return normalize( vec3( x, y, z ) );
        }

        

        vec4 BlendUnder(vec4 color, vec4 newColor, vec3 col)
        {
            
            color.rgb = smoothstep(0.0, 1.0, (newColor.rgb + (col)));
            color.a = newColor.a;
            
            return color;
        }

        vec3 shadeBlinnPhong(vec3 p, vec3 viewDir, vec3 normal, vec3 lightPos, float lightPower, vec3 lightColor) {
            vec3 diffuseColor = vec3(0.2);
            vec3 specColor = vec3(1.);
            float shininess = 8.;

            vec3 lightDir = lightPos - p;
            float dist = length(lightDir);
            dist = dist*dist;
            lightDir = normalize(lightDir);
            
            float lambertian = smoothstep(0.0, 1.0, dot(lightDir, normal));
            float specular = .1;
            
            
            if(lambertian > 0.) {
                
                vec3 halfDir = normalize(viewDir + lightDir);
                float specAngle = max(dot(halfDir, normal), .0);
                specular = pow(specAngle, shininess);
            }

            vec3 ambientColor = vec3(0.5);
            
            vec3 color = ambientColor * diffuseColor + diffuseColor * lambertian * lightColor * lightPower / dist ;
                        
            
            return color;
        }


        void main(){

            vec3 rayDir = normalize( vDirection );
            vec2 bounds = hitBox( vOrigin, rayDir );

            if ( bounds.x > bounds.y ) discard;

            bounds.x = max( bounds.x, 0.0 );

            vec3 p = vOrigin + bounds.x * rayDir;
            vec3 inc = 1.0 / abs( rayDir );
            float delta = min( inc.x, min( inc.y, inc.z ) );
            delta /= steps;

            for ( float t = bounds.x; t < bounds.y; t += delta ) {
                vec4 samplerColor = sample2( p + 0.5 );
                if (samplerColor.a == 1.0) {
                    vec3 col = shadeBlinnPhong(p, vDirection, normal(p), lightPos, lightPower, lightColor);
                    color = BlendUnder(color, samplerColor, col);
                    //color = vec4(col, 1.0);
                    break;
                }
                p += rayDir * delta;

            }
            

            if ( color.a == 0.0 ) discard;

        }
    `;
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    //const material = new THREE.MeshPhongMaterial({ color: 0xff0000 }); // Red color with Phong shading
    const material = new THREE.RawShaderMaterial( {
        glslVersion: THREE.GLSL3,
        uniforms: {
            map: { value: texture },
            cameraPos: { value: camera.position},
            lightPos: {value: new THREE.Vector3(0, 0, 1)},
            lightPower: {value: .004},              
            lightColor: {value: new THREE.Color(255, 255, 255)},
            threshold: { value: 0.85 },
            opacity: { value: 1.0 },
            range: { value: 0.1 },
            steps: { value: 800 },
            frame: { value: 0 },
            shadingSamplingStep: {value: 0.0000001},
        },
        vertexShader,
        fragmentShader,
        side: THREE.BackSide,
        transparent: true
    } ); 

    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    //

    const parameters = {
        threshold: 1,
        opacity: 1,
        range: 1,
        steps: 500,
        shadingSamplingStep: 0.00001,
    };

    function update() {

        material.uniforms.threshold.value = parameters.threshold;
        material.uniforms.opacity.value = parameters.opacity;
        material.uniforms.steps.value = parameters.steps;
        material.uniforms.shadingSamplingStep.value = parameters.shadingSamplingStep;

    }

    /*const gui = new GUI();
    gui.add( parameters, 'threshold', 0, 1, 0.01 ).onChange( update );
    gui.add( parameters, 'opacity', 0, 1, 0.01 ).onChange( update );
    gui.add( parameters, 'steps', 0, 1000, 100 ).onChange( update );
    gui.add( parameters, 'shadingSamplingStep', 0, 0.01, 0.001).onChange( update );*/

    window.addEventListener( 'resize', onWindowResize );



    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

    }

    function animate() {

        mesh.material.uniforms.cameraPos.value.copy( camera.position );
        mesh.rotation.y = - performance.now() / 7500;

        mesh.material.uniforms.frame.value ++;

        renderer.render( scene, camera );


    }
}