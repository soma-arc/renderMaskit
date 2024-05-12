#version 300 es
precision mediump float;

uniform vec2 u_resolution;

uniform vec3 u_cameraPos;
uniform float u_cameraFov;
uniform vec3 u_cameraDir;

uniform mat4 u_cameraWorld;
uniform mat4 u_cameraProjectionInv;
uniform float u_sphereSpace;

uniform int u_numSpheres;
uniform vec2 u_maskitUV;
uniform float u_maskitTranslation;
uniform float u_floorY;
uniform float u_josScale;

layout (location = 0) out vec4 o_position;
layout (location = 1) out vec4 o_normal;
layout (location = 2) out vec4 o_color;

const vec3 SPHERE_POS1 = vec3(300, 300, 300);
const vec3 SPHERE_POS2 = vec3(300, -300, 300);
const vec3 SPHERE_POS3 = vec3(-300, 300, 300);
const vec3 SPHERE_POS4 = vec3(-300, -300, 300);
const vec3 SPHERE_POS5 = vec3(300, 300, -300);
const vec3 SPHERE_POS6 = vec3(300, -300,-300);
const vec3 SPHERE_POS7 = vec3(-300, 300, -300);
const vec3 SPHERE_POS8 = vec3(-300, -300, -300);
const float SPHERE_R = 300.;
const float SPHERE_R2 = SPHERE_R * SPHERE_R;

vec3 rotY(vec3 p, float rad) {
    float cosTheta = cos(rad);
    float sinTheta = sin(rad);
    return (mat4(cosTheta, 0, sinTheta, 0,
                 0, 1, 0, 0,
                 -sinTheta, 0, cosTheta, 0,
                 0, 0, 0, 1) * vec4(p, 1)).xyz;
}

vec3 sphereInvert(vec3 pos, vec3 circlePos, float circleR){
  return ((pos - circlePos) * circleR * circleR)/(distance(pos, circlePos) * distance(pos, circlePos) ) + circlePos;
}

float loopNum = 0.;

vec3 calcRay (const vec3 eye, const vec3 dir, const vec3 up, const float fov,
              const float width, const float height, const vec2 coord){
  float imagePlane = (height * .5) / tan(fov * .5);
  vec3 v = normalize(dir);
  vec3 xaxis = normalize(cross(v, up));
  vec3 yaxis =  normalize(cross(v, xaxis));
  vec3 center = v * imagePlane;
  vec3 origin = center - (xaxis * (width  *.5)) - (yaxis * (height * .5));
  return normalize(origin + (xaxis * coord.x) + (yaxis * (height - coord.y)));
}

const vec4 K = vec4(1.0, .666666, .333333, 3.0);
vec3 hsv2rgb(const vec3 c){
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float distPlane(vec3 p, vec3 n, float d) {
    return dot(p, n) - d;
}

float distBox(vec3 p, vec3 b){
    vec3 q = abs(p) - b;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}


float lineY(vec2 pos, vec2 uv){
	return uv.x * .5 + sign(uv.y * .5) * (2.*uv.x-1.95)/4. * sign(pos.x + uv.y * 0.5)* (1. - exp(-(7.2-(1.95-uv.x)*15.)* abs(pos.x + uv.y * 0.5)));
}

vec3 TransA(vec3 z, vec2 uv, inout float dr){
	float iR = 1. / dot(z, z);
	z *= -iR;
	z.x = -uv.y - z.x;
    z.y = uv.x + z.y;
    dr *= iR;
    return z;
}

const int LOOP_NUM = 200;
vec4 JosKleinian(vec3 pos, const vec2 uv, const float translation) {
    pos -= vec3(0, u_floorY, 0);
    pos *= u_josScale;
    pos.z = mod(pos.z, u_sphereSpace) - (u_sphereSpace * 0.5);
    loopNum = 0.;
    vec3 lz = pos + vec3(1.);
    vec3 llz = pos + vec3(-1.);
    float numTransA = 0.;
    float dr = 1.;

    for(int i = 0 ; i < LOOP_NUM ; i++){
        if(i >= u_numSpheres) {
            break;
        }
        // translate
    	pos.x += translation/2. + (uv.y * pos.y) / uv.x;
        pos.x = mod(pos.x, translation);
        pos.x -= translation/2. + (uv.y * pos.y) / uv.x;

        // rotate 180
        if (pos.y >= lineY(pos.xy, uv.xy)){
            // pos -= vec2(-uv.y, uv.x) * .5;
            // pos = - pos;
            // pos += vec2(-uv.y, uv.x) * .5;
            // |
            pos = vec3(-uv.y, uv.x, 0) - pos;
            //loopNum++;
        }

        pos = TransA(pos, uv, dr);
        loopNum++;

        // 2-cycle
        if(dot(pos-llz,pos-llz) < 1e-6) break;

        llz=lz; lz=pos;
    }

    float y =  min(pos.y, uv.x - pos.y) ;
    float d = 9999999.;
    d = min(d, min(y, 0.3) / max(dr, 2.));
    const float scalingFactor = 0.5;
    return vec4(0, d * scalingFactor, loopNum, numTransA);
}

float distFunc(vec3 originalPos){
    vec3 p = rotY(originalPos, radians(90.));
    float d = JosKleinian(p, u_maskitUV, u_maskitTranslation).y;
    
    //d = min(d, distBox(p + vec3(0, 1, 0), vec3(1.5, 0.3, 0.4)));//distKlein(p);
    vec3 p2 = originalPos;
    d = min(d, JosKleinian(p2, u_maskitUV, u_maskitTranslation).y);
    //d = 10000.;
    d = min(d, distPlane(originalPos, vec3(0, 1, 0), u_floorY));
    return d;
}

const vec2 d = vec2(0.001, 0.);
vec3 getNormal(const vec3 p){
  return normalize(vec3(distFunc(p + d.xyy) - distFunc(p - d.xyy),
                        distFunc(p + d.yxy) - distFunc(p - d.yxy),
                        distFunc(p + d.yyx) - distFunc(p - d.yyx)));
}

const int MAX_MARCHING_LOOP = 1000;
vec2 march(const vec3 origin, const  vec3 ray, const float threshold){
    vec3 rayPos = origin;
    float dist;
    float rayLength = 0.;
    for(int i = 0 ; i < MAX_MARCHING_LOOP ; i++){
        dist = distFunc(rayPos);
        rayLength += dist;
        rayPos = origin + ray * rayLength ;
        if(dist < threshold) break;
    }
    return vec2(dist, rayLength);
}

const float DISPLAY_GAMMA_COEFF = 1. / 2.2;
vec3 gammaCorrect(vec3 rgb) {
  return vec3((min(pow(rgb.r, DISPLAY_GAMMA_COEFF), 1.)),
              (min(pow(rgb.g, DISPLAY_GAMMA_COEFF), 1.)),
              (min(pow(rgb.b, DISPLAY_GAMMA_COEFF), 1.)));
}

vec3 unproject(vec3 v, mat4 cameraProjectionMatrixInv, mat4 matrixWorld) {
    return (vec4(v, 1) * cameraProjectionMatrixInv * matrixWorld).xyz;
}

vec3 getMatrixPosition(mat4 m) {
    return vec3(m[3].x, m[3].y, m[3].z);
}

vec3 computeRay(vec2 coord, mat4 cameraMatrixWorld, mat4 cameraProjectionMatrixInv) {
    vec3 origin = getMatrixPosition(cameraMatrixWorld);
    vec3 dir = vec3(coord, 0.5);
    dir = unproject(dir, cameraProjectionMatrixInv, cameraMatrixWorld);
    return normalize(dir - origin);
}

const vec3 up = vec3(0, 1, 0);

const float MAX_SAMPLES = 20.;
void main() {
    vec4 sum = vec4(0);
    vec3 eye = u_cameraPos * vec3(1, 1, 1);
    vec3 dir = u_cameraDir * vec3(1, 1, 1);
    const vec2 coordOffset = vec2(0.5);
    vec3 ray = calcRay(eye, dir, up, radians(u_cameraFov),
                       u_resolution.x, u_resolution.y,
                       gl_FragCoord.xy + coordOffset);

    vec2 result = march(eye, ray, 0.0001);
    vec3 intersection = eye + ray * result.y;
    vec3 matColor = vec3(0);
    if(result.y > 1000.) {
        intersection = vec3(0, 0, 0);
    } else {
        matColor = hsv2rgb(vec3(0.1 + loopNum * 0.1 , 1., 1.));
    }
    vec3 normal = getNormal(intersection);
    o_position = vec4(intersection, result.x);
    o_normal = vec4(normal, 1);
    o_color = vec4(matColor, 1);
}
