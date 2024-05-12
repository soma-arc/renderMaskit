uniform vec2 u_resolution;

vec2 compProd(const vec2 a, const vec2 b){
    return vec2(a.x * b.x - a.y * b.y,
                a.x * b.y + a.y * b.x);
}

vec2 compQuot(const vec2 a, const vec2 b){
    float denom = dot(b, b);
    return vec2((a.x * b.x + a.y * b.y) / denom,
                (a.y * b.x - a.x * b.y) / denom);
}

const float DISPLAY_GAMMA_COEFF = 1. / 2.2;
vec4 gammaCorrect(vec4 rgba) {
    return vec4((min(pow(rgba.r, DISPLAY_GAMMA_COEFF), 1.)),
                (min(pow(rgba.g, DISPLAY_GAMMA_COEFF), 1.)),
                (min(pow(rgba.b, DISPLAY_GAMMA_COEFF), 1.)),
                rgba.a);
}

void main() {
    float i = gl_FragCoord.x;
    float j = gl_FragCoord.y;
    // vec2 x = vec2(-6. - i / 20., 14 - j / 20.);
    // vec2 y = vec2(2.0 + 6. * j, 0);
    // vec2 z = vec2(x, ) * 0.5;
    gl_FragColor = vec4(gl_FragCoord.xy / u_resolution, 0, 1);
}
