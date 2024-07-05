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
            float average = (color.r + color.g + color.b) / 3.0;
            return average ;
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
            if ( coord.x < epsilon ) return vec3( 1.0, 0.0, 0.0 );
            if ( coord.y < epsilon ) return vec3( 0.0, 1.0, 0.0 );
            if ( coord.z < epsilon ) return vec3( 0.0, 0.0, 1.0 );
            if ( coord.x > 1.0 - epsilon ) return vec3( - 1.0, 0.0, 0.0 );
            if ( coord.y > 1.0 - epsilon ) return vec3( 0.0, - 1.0, 0.0 );
            if ( coord.z > 1.0 - epsilon ) return vec3( 0.0, 0.0, - 1.0 );

            float step = 0.01;
            float x = sample1( coord + vec3( - step, 0.0, 0.0 ) ) - sample1( coord + vec3( step, 0.0, 0.0 ) );
            float y = sample1( coord + vec3( 0.0, - step, 0.0 ) ) - sample1( coord + vec3( 0.0, step, 0.0 ) );
            float z = sample1( coord + vec3( 0.0, 0.0, - step ) ) - sample1( coord + vec3( 0.0, 0.0, step ) );

            return normalize( vec3( x, y, z ) );
        }
        

        vec4 BlendUnder(vec4 color, vec4 newColor, float col)
        {
            
            color.rgb += ( 1.0 - color.a) * (newColor.a) * newColor.rgb * (col);
            color.a += (1.0 - color.a) * newColor.a;
            
            return color;
        }


        void main(){

            vec3 rayDir = normalize( vDirection );
            vec2 bounds = hitBox( vOrigin, rayDir );

            if ( bounds.x > bounds.y ) discard;

            bounds.x = max( bounds.x, 0.0 );

            vec3 p = vOrigin + bounds.x * rayDir;
            vec3 inc = 1.0 / abs( rayDir );
            float og_delta = min( inc.x, min( inc.y, inc.z ) );
            og_delta /= steps;
            float low_delta = og_delta * 0.01;
            float delta = og_delta;

            for ( float t = bounds.x; t < bounds.y; t += delta ) {
                float col = shading( p + 0.5 ) * 6.0 + ( ( p.x + p.y ) * 0.25 ) + 0.75;
                vec4 samplerColor = sample2( p + 0.5 );
                samplerColor.a *= .02;
                vec4 oldColor = color;
                color = BlendUnder(color, samplerColor, col);
                float diff = length(samplerColor - color);
                if (diff > 5.) {
                    // we are changing colors
                    delta = low_delta;
                    color.rgb = ( 1.0 - color.a) * (color.a) * color.rgb * (col);
                }
                else {  
                    color.rgb += ( 1.0 - color.a) * (samplerColor.a) * samplerColor.rgb * (col);
                    color.a += (1.0 - color.a) * samplerColor.a;
                    delta = og_delta;
                }
                //color = texture( map, p + 0.5 )  ;
                if ( color.a >= 0.95 ) break;
                p += rayDir * delta;

            }
            

            if ( color.a == 0.0 ) discard;

        }
    `;


    const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    const material = new THREE.RawShaderMaterial( {
        glslVersion: THREE.GLSL3,
        uniforms: {
            map: { value: texture },
            cameraPos: { value: new THREE.Vector3() },
            base: {value: (128, 128, 128, 0)},
            threshold: { value: 0.85 },
            opacity: { value: 1.0 },
            range: { value: 0.5 },
            steps: { value: 400 },
            frame: { value: 0 },
            shadingSamplingStep: {value: 0.001},
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
        shadingSamplingStep: 0.001,
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