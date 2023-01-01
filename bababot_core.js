class BababotLogger {
    static TEMPLATE = '%c[BababotCore] %s: %s'
    static TEMPLATE_CSS_1 = 'color:green'
    static TEMPLATE_INFO = 'INFO'
    static TEMPLATE_WARNING = 'WARNING'
    static TEMPLATE_ERROR = 'ERROR'
    static LEVEL_INFO = 0
    static LEVEL_WARNING = 1
    static LEVEL_ERROR = 2
    static LEVEL = BababotLogger.LEVEL_INFO
    static info(msg) {
        if (BababotLogger.LEVEL <= BababotLogger.LEVEL_INFO) {
            console.log(BababotLogger.TEMPLATE, BababotLogger.TEMPLATE_CSS_1, BababotLogger.TEMPLATE_INFO, msg)
        }
    }
    static warning(msg) {
        if (BababotLogger.LEVEL <= BababotLogger.LEVEL_WARNING) {
            console.log(BababotLogger.TEMPLATE, BababotLogger.TEMPLATE_CSS_1, BababotLogger.TEMPLATE_WARNING, msg)
        }
    }
    static warning(msg) {
        if (BababotLogger.LEVEL <= BababotLogger.LEVEL_ERROR) {
            console.log(BababotLogger.TEMPLATE, BababotLogger.TEMPLATE_CSS_1, BababotLogger.TEMPLATE_ERROR, msg)
        }
    }
}


class BababotPalette {
    static PALETTE_LOAD_STATIC = 0
    static PALETTE_LOAD_DYNAMIC = 1
    static hexStrToHex(hex_str) {
        return parseInt(hex_str.slice(1), 16)
    }
    static STATIC_COLORS = [16777215, 12895428, 8947848, 5592405, 2236962, 0, 13880, 26112, 1799168, 4681808, 2273612, 179713, 5366041, 9756740, 10025880, 16514907, 15063296, 15121932, 15045888, 16740352, 16726276, 15007744, 13510969, 16728426, 10420224, 7012352, 16741727, 10512962, 6503455, 10048269, 12275456, 16762015, 16768972, 16754641, 13594340, 8201933, 15468780, 8519808, 3342455, 132963, 5308671, 234, 281599, 23457, 6652879, 3586815, 33735, 54237, 4587464, 11921646]
    static STATIC_INDEX = [0, 1, 2, 3, 4, 5, 39, 6, 49, 40, 7, 8, 9, 10, 41, 11, 12, 13, 14, 42, 21, 20, 43, 44, 19, 18, 23, 15, 17, 16, 22, 24, 25, 26, 27, 45, 28, 29, 46, 31, 30, 32, 33, 47, 34, 35, 36, 37, 38, 48]
    initalizePalette(type) {
        if (type == undefined) {
            type = BababotPalette.PALETTE_LOAD_STATIC
            BababotLogger.warning('BababotPalette invoked without specifying the loading type.')
        }
        BababotLogger.info('BababotPalette loading with type: ' + (type == BababotPalette.PALETTE_LOAD_DYNAMIC ? 'DYNAMIC' : 'STATIC'))
        if (type == BababotPalette.PALETTE_LOAD_DYNAMIC) {
            const palette = document.getElementById('palette-buttons')
            if (!palette) {
                throw Error('Palette requested to be loaded dynamically but HTML is not loaded yet.')
            }
            this.colors = []
            this.indexes = []
            const palette_buttons = Array.from(palette.children)
            BababotLogger.info('Dynamic loading found these DOM elements:')
            console.log(palette_buttons)
            for (const palette_button of palette_buttons) {
                const color = {
                    hex: palette_button.getAttribute('title'),
                    index: palette_button.getAttribute('data-id')
                }

                this.colors.push(BababotPalette.hexStrToHex(color.hex))
                this.indexes.push(parseInt(color.index))
            }
        }
    }
    getIndex(x) {
        if (x instanceof Array) {
            const [r, g, b] = x
            const hex = r << 16 | g << 8 | b
            return this.indexes[this.colors.indexOf(hex)]
        } else if (typeof x == 'number') {
            return this.indexes[this.colors.indexOf(x)]
        } else {
            throw Error('Argument is neither type of Array nor a number')
        }
    }
    constructor(type) {
        this.colors = undefined
        this.indexes = undefined
        this.initalizePalette(type);
    }
}

function getGlobal() {
    if (typeof unsafeWindow !== 'undefined') {
        return unsafeWindow
    } else {
        return window
    }
}

class BababotWS {
    constructor() {
        this.ws = undefined
        var proxy = this;
        this.hook = class extends WebSocket {
            constructor(a, b) {
                super(a, b);
                BababotLogger.info('BababotWS has hooked the game WebSocket connection.')
                proxy.ws = this;
            }
        };
        if (typeof unsafeWindow !== undefined) {
            unsafeWindow.WebSocket = this.hook
        }
    }
}

class BababotImagePicker {
    static requestImageFromFileDialog(bababotPalette) {
        const input = document.createElement('input')
        input.type = 'file'
        input.click()
        if (input.files && input.files[0]) {
            const reader = new FileReader
            reader.onload = function (e) {
                return new BababotImage(e.target.result, bababotPalette)
            }
        }
    }
    static addClipboardListener(bababotPalette, callback) {
        document.addEventListener('paste', function (paste_e) {
            var items = (paste_e.clipboardData || paste_e.originalEvent.clipboardData).items;
            BababotLogger.info('Recieved an image from clipboard: ' + JSON.stringify(items));
            var blob = null;
            for (var i = 0; i < items.length; i++) {
                if (items[i].type.indexOf("image") === 0) {
                    blob = items[i].getAsFile();
                }
            }
            if (blob !== null) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    BababotLogger.info('Readed image from clipboard!')
                    callback(new BababotImage(e.target.result, bababotPalette))
                };
                reader.readAsDataURL(blob);
            }
        })
    }
}

class BababotImage {
    constructor(x, palette) {
        this.bababotPalette = palette;
        this.image = undefined;
        this.image_canvas = document.createElement('canvas');
        this.image_context = this.image_canvas.getContext('2d');
        if (x instanceof Image) {
            this.image = x;
        } else if (typeof x == 'string') {
            this.image = new Image
            this.image.src = x
        }
        if (this.image == undefined) {
            throw new Error('Argument is neither type of Image nor a string')
        }
        this.image.onload = () => {
            this.image_canvas.width = this.image.width;
            this.image_canvas.height = this.image.height;
            this.image_context.drawImage(this.image, 0, 0);
            this.image_data = this.image_context.getImageData(0, 0,
                this.image_canvas.width,
                this.image_canvas.height)
        }
    }
    convertToTasks(sx, sy) {
        var _tasks = []
        for (let i = 0; i < this.image_data.data.length; i += 4) {
            var [r, g, b, a] = this.image_data.data.slice(i, i + 4)
            if (a == 0) {
                continue
            }
            var x = (i / 4) % this.image_data.width
            var y = Math.floor((i / 4) / this.image_data.width)
            var colorIndex = this.bababotPalette.getIndex([r, g, b])
            _tasks.push(BababotEngine.convertToTask(x, y, colorIndex))
        }
        return _tasks
    }
}

class BababotEngine {
    static convertToTask(x, y, colorIndex, packetType) {
        if (packetType == undefined) {
            packetType = 1
        }
        return `42["p",${JSON.stringify([x, y, colorIndex, packetType])}]`
    }
    putPixel(x, y, colorIndex) {
        this.tasks.push(this.convertToTask(x, y, colorIndex))
    }
    putPixelWithPriority(x, y, colorIndex) {
        this.tasks.unshift(this.convertToTask(x, y, colorIndex))
    }
    constructor(bababotWS) {
        this.tasks = []
        this.bababotWS = bababotWS
        this.intervalID = setInterval(() => {
            const task = this.tasks.pop()
            if (!task) {
                return
            }
            this.bababotWS.ws.send(task)
        })
    }
}

class BababotCore {
    constructor() {
        this.bababotWS = new BababotWS()
        this.engine = new BababotEngine()
        this.palette = new BababotPalette(BababotPalette.PALETTE_LOAD_DYNAMIC)
        this.
            this.options = {
            "drawingMode": (x, y) => x[0] + x[1] * 0xfffff - y[0] - y[1] * 0xfffff,
            "timeout": 20
        }
    }
}
