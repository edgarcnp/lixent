export function md5(str: string): string {
    function add32(a: number, b: number): number {
        return (a + b) & 0xFFFFFFFF
    }

    function cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
        a = add32(add32(a, q), add32(x, t))
        return add32((a << s) | (a >>> (32 - s)), b)
    }

    function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return cmn((b & c) | (~b & d), a, b, x, s, t)
    }

    function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return cmn((b & d) | (c & ~d), a, b, x, s, t)
    }

    function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return cmn(b ^ c ^ d, a, b, x, s, t)
    }

    function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number): number {
        return cmn(c ^ (b | ~d), a, b, x, s, t)
    }

    function md5blk(s: string): number[] {
        const md5blks: number[] = []
        for (let i = 0; i < 64; i += 4) {
            md5blks[i >> 2] = s.charCodeAt(i)
                + (s.charCodeAt(i + 1) << 8)
                + (s.charCodeAt(i + 2) << 16)
                + (s.charCodeAt(i + 3) << 24)
        }
        return md5blks
    }

    function rhex(n: number): string {
        const hc = "0123456789abcdef"
        let s = ""
        for (let j = 0; j < 4; j++) {
            s += hc.charAt((n >> ((j * 8) + 4)) & 0x0F)
                + hc.charAt((n >> (j * 8)) & 0x0F)
        }
        return s
    }

    function hex(x: number[]): string {
        return rhex(x[0]) + rhex(x[1]) + rhex(x[2]) + rhex(x[3])
    }

    const bytes = new TextEncoder().encode(str)
    let encoded = ""
    for (let j = 0; j < bytes.length; j++) {
        encoded += String.fromCharCode(bytes[j])
    }
    const n = encoded.length
    const state = [1732584193, -271733879, -1732584194, 271733878]
    let i

    for (i = 64; i <= n; i += 64) {
        const X = md5blk(encoded.substring(i - 64, i))
        let a = state[0], b = state[1], c = state[2], d = state[3]

        a = ff(a, b, c, d, X[0], 7, -680876936)
        d = ff(d, a, b, c, X[1], 12, -389564586)
        c = ff(c, d, a, b, X[2], 17, 606105819)
        b = ff(b, c, d, a, X[3], 22, -1044525330)
        a = ff(a, b, c, d, X[4], 7, -176418897)
        d = ff(d, a, b, c, X[5], 12, 1200080426)
        c = ff(c, d, a, b, X[6], 17, -1473231341)
        b = ff(b, c, d, a, X[7], 22, -45705983)
        a = ff(a, b, c, d, X[8], 7, 1770035416)
        d = ff(d, a, b, c, X[9], 12, -1958414417)
        c = ff(c, d, a, b, X[10], 17, -42063)
        b = ff(b, c, d, a, X[11], 22, -1990404162)
        a = ff(a, b, c, d, X[12], 7, 1804603682)
        d = ff(d, a, b, c, X[13], 12, -40341101)
        c = ff(c, d, a, b, X[14], 17, -1502002290)
        b = ff(b, c, d, a, X[15], 22, 1236535329)

        a = gg(a, b, c, d, X[1], 5, -165796510)
        d = gg(d, a, b, c, X[6], 9, -1069501632)
        c = gg(c, d, a, b, X[11], 14, 643717713)
        b = gg(b, c, d, a, X[0], 20, -373897302)
        a = gg(a, b, c, d, X[5], 5, -701558691)
        d = gg(d, a, b, c, X[10], 9, 38016083)
        c = gg(c, d, a, b, X[15], 14, -660478335)
        b = gg(b, c, d, a, X[4], 20, -405537848)
        a = gg(a, b, c, d, X[9], 5, 568446438)
        d = gg(d, a, b, c, X[14], 9, -1019803690)
        c = gg(c, d, a, b, X[3], 14, -187363961)
        b = gg(b, c, d, a, X[8], 20, 1163531501)
        a = gg(a, b, c, d, X[13], 5, -1444681467)
        d = gg(d, a, b, c, X[2], 9, -51403784)
        c = gg(c, d, a, b, X[7], 14, 1735328473)
        b = gg(b, c, d, a, X[12], 20, -1926607734)

        a = hh(a, b, c, d, X[5], 4, -378558)
        d = hh(d, a, b, c, X[8], 11, -2022574463)
        c = hh(c, d, a, b, X[11], 16, 1839030562)
        b = hh(b, c, d, a, X[14], 23, -35309556)
        a = hh(a, b, c, d, X[1], 4, -1530992060)
        d = hh(d, a, b, c, X[4], 11, 1272893353)
        c = hh(c, d, a, b, X[7], 16, -155497632)
        b = hh(b, c, d, a, X[10], 23, -1094730640)
        a = hh(a, b, c, d, X[13], 4, 681279174)
        d = hh(d, a, b, c, X[0], 11, -358537222)
        c = hh(c, d, a, b, X[3], 16, -722521979)
        b = hh(b, c, d, a, X[6], 23, 76029189)
        a = hh(a, b, c, d, X[9], 4, -640364487)
        d = hh(d, a, b, c, X[12], 11, -421815835)
        c = hh(c, d, a, b, X[15], 16, 530742520)
        b = hh(b, c, d, a, X[2], 23, -995338651)

        a = ii(a, b, c, d, X[0], 6, -198630844)
        d = ii(d, a, b, c, X[7], 10, 1126891415)
        c = ii(c, d, a, b, X[14], 15, -1416354905)
        b = ii(b, c, d, a, X[5], 21, -57434055)
        a = ii(a, b, c, d, X[12], 6, 1700485571)
        d = ii(d, a, b, c, X[3], 10, -1894986606)
        c = ii(c, d, a, b, X[10], 15, -1051523)
        b = ii(b, c, d, a, X[1], 21, -2054922799)
        a = ii(a, b, c, d, X[8], 6, 1873313359)
        d = ii(d, a, b, c, X[15], 10, -30611744)
        c = ii(c, d, a, b, X[6], 15, -1560198380)
        b = ii(b, c, d, a, X[13], 21, 1309151649)
        a = ii(a, b, c, d, X[4], 6, -145523070)
        d = ii(d, a, b, c, X[11], 10, -1120210379)
        c = ii(c, d, a, b, X[2], 15, 718787259)
        b = ii(b, c, d, a, X[9], 21, -343485551)

        state[0] = add32(state[0], a)
        state[1] = add32(state[1], b)
        state[2] = add32(state[2], c)
        state[3] = add32(state[3], d)
    }

    const X = md5blk(encoded.substring(i - 64))
    let a = state[0], b = state[1], c = state[2], d = state[3]

    a = ff(a, b, c, d, X[0], 7, -680876936)
    d = ff(d, a, b, c, X[1], 12, -389564586)
    c = ff(c, d, a, b, X[2], 17, 606105819)
    b = ff(b, c, d, a, X[3], 22, -1044525330)
    a = ff(a, b, c, d, X[4], 7, -176418897)
    d = ff(d, a, b, c, X[5], 12, 1200080426)
    c = ff(c, d, a, b, X[6], 17, -1473231341)
    b = ff(b, c, d, a, X[7], 22, -45705983)
    a = ff(a, b, c, d, X[8], 7, 1770035416)
    d = ff(d, a, b, c, X[9], 12, -1958414417)
    c = ff(c, d, a, b, X[10], 17, -42063)
    b = ff(b, c, d, a, X[11], 22, -1990404162)
    a = ff(a, b, c, d, X[12], 7, 1804603682)
    d = ff(d, a, b, c, X[13], 12, -40341101)
    c = ff(c, d, a, b, X[14], 17, -1502002290)
    b = ff(b, c, d, a, X[15], 22, 1236535329)

    a = gg(a, b, c, d, X[1], 5, -165796510)
    d = gg(d, a, b, c, X[6], 9, -1069501632)
    c = gg(c, d, a, b, X[11], 14, 643717713)
    b = gg(b, c, d, a, X[0], 20, -373897302)
    a = gg(a, b, c, d, X[5], 5, -701558691)
    d = gg(d, a, b, c, X[10], 9, 38016083)
    c = gg(c, d, a, b, X[15], 14, -660478335)
    b = gg(b, c, d, a, X[4], 20, -405537848)
    a = gg(a, b, c, d, X[9], 5, 568446438)
    d = gg(d, a, b, c, X[14], 9, -1019803690)
    c = gg(c, d, a, b, X[3], 14, -187363961)
    b = gg(b, c, d, a, X[8], 20, 1163531501)
    a = gg(a, b, c, d, X[13], 5, -1444681467)
    d = gg(d, a, b, c, X[2], 9, -51403784)
    c = gg(c, d, a, b, X[7], 14, 1735328473)
    b = gg(b, c, d, a, X[12], 20, -1926607734)

    a = hh(a, b, c, d, X[5], 4, -378558)
    d = hh(d, a, b, c, X[8], 11, -2022574463)
    c = hh(c, d, a, b, X[11], 16, 1839030562)
    b = hh(b, c, d, a, X[14], 23, -35309556)
    a = hh(a, b, c, d, X[1], 4, -1530992060)
    d = hh(d, a, b, c, X[4], 11, 1272893353)
    c = hh(c, d, a, b, X[7], 16, -155497632)
    b = hh(b, c, d, a, X[10], 23, -1094730640)
    a = hh(a, b, c, d, X[13], 4, 681279174)
    d = hh(d, a, b, c, X[0], 11, -358537222)
    c = hh(c, d, a, b, X[3], 16, -722521979)
    b = hh(b, c, d, a, X[6], 23, 76029189)
    a = hh(a, b, c, d, X[9], 4, -640364487)
    d = hh(d, a, b, c, X[12], 11, -421815835)
    c = hh(c, d, a, b, X[15], 16, 530742520)
    b = hh(b, c, d, a, X[2], 23, -995338651)

    a = ii(a, b, c, d, X[0], 6, -198630844)
    d = ii(d, a, b, c, X[7], 10, 1126891415)
    c = ii(c, d, a, b, X[14], 15, -1416354905)
    b = ii(b, c, d, a, X[5], 21, -57434055)
    a = ii(a, b, c, d, X[12], 6, 1700485571)
    d = ii(d, a, b, c, X[3], 10, -1894986606)
    c = ii(c, d, a, b, X[10], 15, -1051523)
    b = ii(b, c, d, a, X[1], 21, -2054922799)
    a = ii(a, b, c, d, X[8], 6, 1873313359)
    d = ii(d, a, b, c, X[15], 10, -30611744)
    c = ii(c, d, a, b, X[6], 15, -1560198380)
    b = ii(b, c, d, a, X[13], 21, 1309151649)
    a = ii(a, b, c, d, X[4], 6, -145523070)
    d = ii(d, a, b, c, X[11], 10, -1120210379)
    c = ii(c, d, a, b, X[2], 15, 718787259)
    b = ii(b, c, d, a, X[9], 21, -343485551)

    state[0] = add32(state[0], a)
    state[1] = add32(state[1], b)
    state[2] = add32(state[2], c)
    state[3] = add32(state[3], d)

    return hex(state)
}
