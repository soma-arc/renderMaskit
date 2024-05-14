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

float compAbs(vec2 z) {
    return length(z);
}

vec2 compSqrt(vec2 z) {
    float mag = length(z);
    float angle = atan(z.y, z.x);

    // 平方根の大きさ
    float sqrtMag = sqrt(mag);

    // 平方根の偏角
    float sqrtAngle = angle * 0.5;

    // 実部と虚部を計算
    float real = sqrtMag * cos(sqrtAngle);
    float imag = sqrtMag * sin(sqrtAngle);

    return vec2(real, imag);
}

float H(vec2 x) {
    vec2 x2 = compProd(x, x);
    float absImd = compAbs(x + compSqrt(x2 - vec2(4, 0)) * 0.5);
    if(absImd < 1.0) {
        absImd  = 1 / absImd;
    }
    return sqrt(compSqrt(compQuot(x2, x2 - vec2(4, 0)))) * (2.0 * absImd * absImd) / (absImd - 1.0)
}


bool BQ(vec2 a, vec2 b, vec2 c) {
    if(compAbs(a) < 0.5 || compAbs(b) < 0.5 || compAbs < 0.5) {
        return false;
    }
    for(int i = 0; i < 1000; i ++) {
        vec2 A = compProd(b, c) - a;
        vec2 B = compProd(c, a) - b;
        vec2 C = compProd(a, b) - c;
        float absA = compAbs(A);
        float absB = compAbs(B);
        float absC = compAbs(C);
        if(absA < 0.5 || absB < 0.5 || absC < 0.5) {
            return false;
        }
        if(absA < compAbs(a)){
            a = A;
            continue;
        }
        if(absB < compAbs(b)){
            b = B;
            continue;
        }
        if(absC < compAbs(c)){
            c = C;
            continue;
        }

        break;
    }

    return BQ_dfs(a, b, c, 0) && BQ_dfs(b, c, a, 0) && BQ_dfs(c, b, a, 0);
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
    vec2 x = vec2(-6. - i / 20., 14 - j / 20.);
    vec2 y = vec2(2.0 + 6. * j, 0);
    vec2 x2 = compProd(x, x);
    vec2 y2 = compProd(y, y);
    vec2 x2y2 = compProd(x2, y2);
    vec2 z = (compProd(x, y) + compSqrt(x2y2 - 4 * (x2 + y2))) * 0.5;
    gl_FragColor = vec4(gl_FragCoord.xy / u_resolution, 0, 1);
}
