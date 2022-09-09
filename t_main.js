const fs = require('fs')

class SineOscillator {
    constructor(freq = 0.0, amp = 0.0, sampleRate = 0){
        this.frequency = freq, this.amplitude = amp, this.angle = 0
        this.offset = 2 * Math.PI * this.frequency / sampleRate
    }

    process(){
        var sample = this.amplitude * Math.sin(this.angle)

        this.angle += this.offset

        return sample
    }
}

class SquareOscillator {
    constructor(freq = 0.0, amp = 0.0, sampleRate = 0){
        this.switch = true // true = 1, false = -1
        this.ticks = Math.floor((sampleRate / 2) / freq)
        this.cur_tick = 0
        this.amplitude = amp
    }

    process(){
        if(this.cur_tick > this.ticks){
            this.cur_tick = 0
            this.switch = !this.switch
        }

        var sample = this.switch ? this.amplitude : -this.amplitude

        this.cur_tick++

        return sample
    }
}

class SawtoothOscillator {
    constructor(freq = 0.0, amp = 0.0, sampleRate = 0){
        this.val = 0
        this.amplitude = amp
        this.offset = freq / (sampleRate / 2)
    }

    process(){
        if(this.val >= 1){
            this.val = -1
        }

        var sample = this.val

        this.val += this.offset

        return this.amplitude * sample
    }
}

class TriangleOscillator {
    constructor(freq = 0.0, amp = 0.0, sampleRate = 0){
        this.val = -1
        this.switch = true // true = +, false = -
        this.offset = freq / (sampleRate / 4)
        this.amplitude = amp
    }

    process(){
        if(this.val >= 1){
            this.switch = false
        } else if(this.val <= -1){
            this.switch = true
        }

        var sample = this.val

        this.val += this.offset * (this.switch ? 1 : -1)

        return this.amplitude * (Math.abs(parseInt(sample)) == 1 ? parseInt(sample) : sample) // this.amplitude * parseFloat(sample.toPrecision(2))
    }
}

let invalidInt = (val) => (isNaN(val) || typeof val !== "number" || !val)

function generatePCMData(sampleRate, bitDepth, duration, oscillatorClass, frequency, amplitude){
    if(invalidInt(sampleRate) || invalidInt(bitDepth) || invalidInt(duration) || invalidInt(frequency) || invalidInt(amplitude)) return null

    var Osc = new oscillatorClass(frequency, amplitude, sampleRate)

    var maxAmplitude = Math.pow(2, bitDepth - 1) - 1

    var data = []

    for(var i = 0; i < sampleRate * duration; i++){
        var sample = Osc.process()
        var intSample = (sample * maxAmplitude)

        data.push(intSample)
    }

    return data
}

function MultiOscillatorPCM(sampleRate, bitDepth, duration, initializedOscillatorClasses){
    if(invalidInt(sampleRate) || invalidInt(bitDepth) || invalidInt(duration)) return null

    var data = []
    var maxAmplitude = Math.pow(2, bitDepth - 1) - 1
    var channels = initializedOscillatorClasses.length

    var curosc = 0

    for(var i = 0; i < sampleRate * (duration * channels); i++){
        if(curosc >= channels){
            curosc = 0
        }

        var sample = initializedOscillatorClasses[curosc].process()
        var intSample = (sample * maxAmplitude)

        data.push(intSample)

        curosc++
    }

    return data
}

function toMonoPCM(data, channels){
    if(!Array.isArray(data) || !data.every(val => typeof val === "number") || invalidInt(channels)) return null

    var fdata = []

    for(var i = 0; i < data.length; i += (channels ** 2)){
        for(var ch = 0; ch < channels; ch++){
            fdata.push(data[i + ch])
        }
    }

    return fdata
}

function WAVEBuffer(data, chunkDataSize, compressionCode, channels, sampleRate, bitDepth){
    if(!Array.isArray(data) || !data.every(val => typeof val === "number")) return null
    if(invalidInt(chunkDataSize) || invalidInt(compressionCode) || invalidInt(channels) || invalidInt(sampleRate) || invalidInt(bitDepth)) return null

    return Buffer.from([
        ...Buffer.from('RIFF----WAVEfmt '), // 8-bit, 1 byte, Chunk ID
        ...Buffer.from(new Int32Array([chunkDataSize]).buffer), // 32-bit, 4 bytes, Chunk data size
        ...Buffer.from(new Int16Array([compressionCode]).buffer), // 16-bit, 2 bytes, Compression code: PCM = 0x0001 = 1
        ...Buffer.from(new Int16Array([channels]).buffer), // 16-bit, 2 bytes, Number of channels
        ...Buffer.from(new Int32Array([sampleRate]).buffer), // 32-bit, 4 bytes, Sample rate
        ...Buffer.from(new Int32Array([sampleRate * bitDepth / 8]).buffer), // 32-bit, 4 bytes, Byte rate
        ...Buffer.from(new Int16Array([bitDepth / 8]).buffer), // 16-bit, 2 bytes, Block align
        ...Buffer.from(new Int16Array([bitDepth]).buffer), // 16-bit, 2 bytes, Bit depth
        ...Buffer.from('data----'), // 8-bit, 1 byte, Data chunk point
        ...Buffer.from(new Int16Array(data).buffer), // 16-bit, 2 bytes, Raw PCM data
    ])
}

function main(){
    const sampleRate = 44100
    const bitDepth = 16

    var data = generatePCMData(sampleRate, bitDepth, 5, SineOscillator, 1, 1)
    var buf = WAVEBuffer(data, 16, 1, 1, sampleRate, bitDepth)

    console.log(data, buf)

    fs.writeFileSync('waveform' + ".wav", buf)

    console.log('Done.')

    return 0
}

main()
