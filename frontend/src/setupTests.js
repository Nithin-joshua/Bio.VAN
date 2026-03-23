import '@testing-library/jest-dom';

// Mock MediaRecorder
globalThis.MediaRecorder = class {
    constructor(stream, options) {
        this.stream = stream;
        this.options = options;
        this.start = () => { };
        this.stop = () => {
            if (this.onstop) {
                this.onstop();
            }
        };
        this.ondataavailable = () => { };
    }
    static isTypeSupported() {
        return true;
    }
};

// Mock Canvas API for VoiceRecorder component
HTMLCanvasElement.prototype.getContext = () => {
    return {
        fillRect: () => { },
        clearRect: () => { },
        getImageData: (x, y, w, h) => {
            return {
                data: new Array(w * h * 4)
            };
        },
        putImageData: () => { },
        createImageData: () => [],
        setTransform: () => { },
        drawImage: () => { },
        save: () => { },
        responseText: () => { },
        restore: () => { },
        beginPath: () => { },
        moveTo: () => { },
        lineTo: () => { },
        closePath: () => { },
        stroke: () => { },
        translate: () => { },
        scale: () => { },
        rotate: () => { },
        arc: () => { },
        fill: () => { },
        measureText: () => {
            return { width: 0 };
        },
        transform: () => { },
        rect: () => { },
        clip: () => { },
    };
};

// Mock AudioContext
globalThis.AudioContext = class {
    constructor() {
        this.createAnalyser = () => ({
            connect: () => { },
            disconnect: () => { },
            fftSize: 2048,
            frequencyBinCount: 1024,
            getByteFrequencyData: () => { },
            getByteTimeDomainData: () => { },
        });
        this.createMediaStreamSource = () => ({
            connect: () => { },
            disconnect: () => { },
        });
        this.createOscillator = () => ({
            connect: () => { },
            start: () => { },
            stop: () => { },
        });
        this.createGain = () => ({
            connect: () => { },
            gain: { value: 1 },
        });
        this.resume = async () => { };
        this.suspend = async () => { };
        this.close = async () => { };
    }
};

globalThis.window.AudioContext = globalThis.AudioContext;

// Mock navigator.mediaDevices
Object.defineProperty(globalThis.navigator, 'mediaDevices', {
    value: {
        getUserMedia: async () => ({
            getTracks: () => [{ stop: () => { } }],
        }),
    },
});

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => { }, // deprecated
        removeListener: () => { }, // deprecated
        addEventListener: () => { },
        removeEventListener: () => { },
        dispatchEvent: () => { },
    }),
});
