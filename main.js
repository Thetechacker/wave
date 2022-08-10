const fs = require('fs')

const sampleRate = 44100
const bitDepth = 16

class SineOscillator {
    constructor(freq = 0.0, amp = 0.0){
        this.frequency = freq, this.amplitude = amp, this.angle = 0

        this.offset = 2 * Math.PI * this.frequency / sampleRate
    }

    process(){
        var sample = this.amplitude * Math.sin(this.angle)

        this.angle += this.offset

        return sample
    }
}

function main(){
    var durationInSecs = 2
    var SinOsc = new SineOscillator(440, 0.5)

    var maxAmplitude = Math.pow(2, bitDepth - 1) - 1

    var data = []

    for(var i = 0; i < sampleRate * durationInSecs; i++){
        var sample = SinOsc.process()
        var intSample = (sample * maxAmplitude)

        data.push(intSample)
    }

    fs.writeFileSync('waveform.wav', Buffer.from([
        ...Buffer.from('RIFF----WAVEfmt '), // 8-bit, 1 byte, Chunk ID
        ...Buffer.from(new Int32Array([16]).buffer), // 32-bit, 4 bytes, Chunk data size
        ...Buffer.from(new Int16Array([1]).buffer), // 16-bit, 2 bytes, Compression code: PCM = 0x0001 = 1
        ...Buffer.from(new Int16Array([1]).buffer), // 16-bit, 2 bytes, Number of channels
        ...Buffer.from(new Int32Array([sampleRate]).buffer), // 32-bit, 4 bytes, Sample rate
        ...Buffer.from(new Int32Array([sampleRate * bitDepth / 8]).buffer), // 32-bit, 4 bytes, Byte rate
        ...Buffer.from(new Int16Array([bitDepth / 8]).buffer), // 16-bit, 2 bytes, Block align
        ...Buffer.from(new Int16Array([bitDepth]).buffer), // 16-bit, 2 bytes, Bit depth
        ...Buffer.from('data----'), // 8-bit, 1 byte, Data chunk point
        ...Buffer.from(new Int16Array(data).buffer), // 16-bit, 2 bytes, Raw PCM data
    ]))

    console.log('Done.')

    return 0
}

main()