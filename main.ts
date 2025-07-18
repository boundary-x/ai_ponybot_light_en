/**
 * Well known colors for a NeoPixel strip
 */
enum NeoPixelColors {
    //% block="Red"
    Red = 0xFF0000,
    //% block="Orange"
    Orange = 0xFFA500,
    //% block="Yellow"
    Yellow = 0xFFFF00,
    //% block="Green"
    Green = 0x00FF00,
    //% block="Blue"
    Blue = 0x0000FF,
    //% block="Indigo"
    Indigo = 0x000080,
    //% block="Violet"
    Violet = 0x8a2be2,
    //% block="White"
    White = 0xFFFFFF,
    //% block="Off"
    Black = 0x000000
}

/**
 * Different modes for RGB or RGB+W NeoPixel strips
 */
enum NeoPixelMode {
    //% block="RGB (GRB format)"
    RGB = 1,
    //% block="RGB+W"
    RGBW = 2,
    //% block="RGB (RGB format)"
    RGB_RGB = 3
}

/**
 * Functions to operate NeoPixel strips.
 */
//% weight=5 color=#58ACFA icon="\uf057" block="Ponybot Light"
namespace neopixel {
    /**
     * A NeoPixel strip
     */
    export class Strip {
        buffer: Buffer;
        pin: DigitalPin;
        brightness: number;
        start: number;
        length: number;
        mode: NeoPixelMode;
        matrixWidth: number;

        //--------------------------Light Control(basic)------------------------------------
        /**
         * Shows all LEDs to a given color (range 0-255 for r, g, b).
         * @param rgb RGB color of the LED
         */
        //% blockId="neopixel_set_strip_color" block="%strip|show all lights to %rgb=neopixel_colors"
        //% strip.defl=strip
        //% weight=70 blockGap=8
        //% group="Basic Light Control"
        showColor(rgb: number) {
            rgb = rgb >> 0;
            this.setAllRGB(rgb);
            this.show();
        }

        //--------------------------Light Control(advanced)------------------------------------
        /**
         * Shows a rainbow pattern on all LEDs.
         * @param startHue the start hue value for the rainbow, eg: 1
         * @param endHue the end hue value for the rainbow, eg: 360
         */
        //% blockId="neopixel_set_strip_rainbow" block="%strip rainbow from %startHue to %endHue"
        //% strip.defl=strip
        //% weight=70 blockGap=8
        //% group="Advanced Light Control"
        //% startHue.min=0 startHue.max=360
        //% endHue.min=0 endHue.max=360
        showRainbow(startHue: number = 1, endHue: number = 360) {
            if (this.length <= 0) return;

            startHue = startHue >> 0;
            endHue = endHue >> 0;
            const saturation = 100;
            const luminance = 50;
            const steps = this.length;
            const direction = HueInterpolationDirection.Clockwise;

            // hue
            const hue1 = startHue;
            const hue2 = endHue;
            const hueDistanceCW = ((hue2 + 360) - hue1) % 360;
            const hueStepCW = Math.idiv((hueDistanceCW * 100), steps);
            const hueDistanceCCW = ((hue1 + 360) - hue2) % 360;
            const hueStepCCW = Math.idiv(-(hueDistanceCCW * 100), steps);
            let hueStep: number;
            if (direction === HueInterpolationDirection.Clockwise) {
                hueStep = hueStepCW;
            } else if (direction === HueInterpolationDirection.CounterClockwise) {
                hueStep = hueStepCCW;
            } else {
                hueStep = hueDistanceCW < hueDistanceCCW ? hueStepCW : hueStepCCW;
            }
            const hue1_100 = hue1 * 100;

            // saturation
            const saturation1 = saturation;
            const saturation2 = saturation;
            const saturationDistance = saturation2 - saturation1;
            const saturationStep = Math.idiv(saturationDistance, steps);
            const saturation1_100 = saturation1 * 100;

            // luminance
            const luminance1 = luminance;
            const luminance2 = luminance;
            const luminanceDistance = luminance2 - luminance1;
            const luminanceStep = Math.idiv(luminanceDistance, steps);
            const luminance1_100 = luminance1 * 100;

            // interpolate
            if (steps === 1) {
                this.setPixelColor(0, hsl(hue1 + hueStep, saturation1 + saturationStep, luminance1 + luminanceStep));
            } else {
                this.setPixelColor(0, hsl(startHue, saturation, luminance));
                for (let i = 1; i < steps - 1; i++) {
                    const hue = Math.idiv((hue1_100 + i * hueStep), 100) + 360;
                    const sat = Math.idiv((saturation1_100 + i * saturationStep), 100);
                    const lum = Math.idiv((luminance1_100 + i * luminanceStep), 100);
                    this.setPixelColor(i, hsl(hue, sat, lum));
                }
                this.setPixelColor(steps - 1, hsl(endHue, saturation, luminance));
            }
            this.show();
        }

        /**
         * Displays a vertical bar graph based on the `value` and `high` value.
         * If `high` is 0, the chart gets adjusted automatically.
         * @param value current value to plot
         * @param high maximum value, eg: 255
         */
        //% blockId="neopixel_show_bar_graph" block="%strip bar graph of value %value max %high"
        //% strip.defl=strip
        //% weight=60 blockGap=8
        //% group="Advanced Light Control"
        showBarGraph(value: number, high: number): void {
            if (high <= 0) {
                this.clear();
                this.setPixelColor(0, NeoPixelColors.Yellow);
                this.show();
                return;
            }

            value = Math.abs(value);
            const pixelCount = this.length;
            const pixelCountMinusOne = pixelCount - 1;
            let scaledValue = Math.idiv((value * pixelCount), high);
            if (scaledValue == 0) {
                this.setPixelColor(0, 0x666600);
                for (let i = 1; i < pixelCount; ++i)
                    this.setPixelColor(i, 0);
            } else {
                for (let i = 0; i < pixelCount; ++i) {
                    if (i <= scaledValue) {
                        const brightness = Math.idiv(i * 255, pixelCountMinusOne);
                        this.setPixelColor(i, neopixel.rgb(brightness, 0, 255 - brightness));
                    } else {
                        this.setPixelColor(i, 0);
                    }
                }
            }
            this.show();
        }

        /**
         * Set LED to a given color (range 0-255 for r, g, b).
         * You need to call ``show`` to make the changes visible.
         * @param pixelOffset position of the NeoPixel in the strip
         * @param rgb RGB color of the LED
         */
        //% blockId="neopixel_set_pixel_color"
        //% block="%strip set pixel %pixelOffset to color %rgb=neopixel_colors"
        //% group="Advanced Light Control"
        //% weight=90
        //% blockGap=8
        //% strip.defl=strip
        setPixelColor(pixelOffset: number, rgb: number): void {
            this.setPixelRGB(pixelOffset >> 0, rgb >> 0);
        }

        /**
         * Send all the changes to the strip.
         */
        //% blockId="neopixel_show"
        //% block="%strip show light settings"
        //% group="Advanced Light Control"
        //% weight=80
        //% blockGap=8
        //% strip.defl=strip
        show() {
            // only supported in beta
            // ws2812b.setBufferMode(this.pin, this.mode);
            ws2812b.sendBuffer(this.buffer, this.pin);
        }

        /**
         * Turn off all LEDs.
         * You need to call ``show`` to make the changes visible.
         */
        //% blockId="neopixel_clear"
        //% block="%strip turn off all lights"
        //% group="Basic Light Control"
        //% weight=60
        //% blockGap=8
        //% strip.defl=strip
        clear(): void {
            const stride = this.mode === NeoPixelMode.RGBW ? 4 : 3;
            this.buffer.fill(0, this.start * stride, this.length * stride);
            this.show();
        }

        /**
         * Gets the number of pixels declared on the strip
         */
        //% group="Advanced Light Control"
        //% blockId="neopixel_length" block="Number of pixels in %strip"
        //% strip.defl=strip
        //% blockGap=8
        //% weight=100
        getLength() {
            return this.length;
        }

        /**
         * Set the brightness of the strip. This flag only applies to future operation.
         * @param brightness a measure of LED brightness in 0-255. eg: 255
         */
        //% group="Basic Light Control"
        //% blockId="neopixel_set_brightness" block="%strip set brightness to %brightness"
        //% strip.defl=strip
        //% blockGap=8
        //% weight=80
        setBrightness(brightness: number): void {
            this.brightness = brightness & 0xff;
        }

        /**
         * Create a range of LEDs.
         * @param start offset in the LED strip to start the range
         * @param length number of LEDs in the range. eg: 4
         */
        //% blockId="neopixel_range"
        //% block="%strip lights from index %start for %length pixels"
        //% blockSetVariable=range
        //% group="Basic Light Control"
        //% weight=90
        //% strip.defl=strip
        //% start.defl=0
        //% length.defl=3
        createRange(start: number, length: number): Strip {
            start = start >> 0;
            length = length >> 0;
            let strip = new Strip();
            strip.buffer = this.buffer;
            strip.pin = this.pin;
            strip.brightness = this.brightness;
            strip.start = this.start + Math.clamp(0, this.length - 1, start);
            strip.length = Math.clamp(0, this.length - (strip.start - this.start), length);
            strip.matrixWidth = 0;
            strip.mode = this.mode;
            return strip;
        }

        /**
         * Set the pin where the neopixel is connected, defaults to P0.
         */
        //% weight=10
        setPin(pin: DigitalPin): void {
            this.pin = pin;
            pins.digitalWritePin(this.pin, 0);
            // don't yield to avoid races on initialization
        }

        private setBufferRGB(offset: number, red: number, green: number, blue: number): void {
            if (this.mode === NeoPixelMode.RGB_RGB) {
                this.buffer[offset + 0] = red;
                this.buffer[offset + 1] = green;
            } else {
                this.buffer[offset + 0] = green;
                this.buffer[offset + 1] = red;
            }
            this.buffer[offset + 2] = blue;
        }

        private setAllRGB(rgb: number) {
            let red = unpackR(rgb);
            let green = unpackG(rgb);
            let blue = unpackB(rgb);

            const brightness = this.brightness;
            if (brightness < 255) {
                red = (red * brightness) >> 8;
                green = (green * brightness) >> 8;
                blue = (blue * brightness) >> 8;
            }
            const end = this.start + this.length;
            const stride = this.mode === NeoPixelMode.RGBW ? 4 : 3;
            for (let i = this.start; i < end; ++i) {
                this.setBufferRGB(i * stride, red, green, blue);
            }
        }

        private setAllWhite(white: number) {
            if (this.mode !== NeoPixelMode.RGBW)
                return;

            let brightness = this.brightness;
            if (brightness < 255) {
                white = (white * brightness) >> 8;
            }
            let buffer = this.buffer;
            let end = this.start + this.length;
            for (let i = this.start; i < end; ++i) {
                let ledOffset = i * 4;
                buffer[ledOffset + 3] = white;
            }
        }

        private setPixelRGB(pixelOffset: number, rgb: number): void {
            if (pixelOffset < 0 || pixelOffset >= this.length)
                return;

            let stride = this.mode === NeoPixelMode.RGBW ? 4 : 3;
            pixelOffset = (pixelOffset + this.start) * stride;

            let red = unpackR(rgb);
            let green = unpackG(rgb);
            let blue = unpackB(rgb);

            let brightness = this.brightness;
            if (brightness < 255) {
                red = (red * brightness) >> 8;
                green = (green * brightness) >> 8;
                blue = (blue * brightness) >> 8;
            }
            this.setBufferRGB(pixelOffset, red, green, blue);
        }

        private setPixelWhite(pixelOffset: number, white: number): void {
            if (this.mode !== NeoPixelMode.RGBW)
                return;

            if (pixelOffset < 0 || pixelOffset >= this.length)
                return;

            pixelOffset = (pixelOffset + this.start) * 4;

            let brightness = this.brightness;
            if (brightness < 255) {
                white = (white * brightness) >> 8;
            }
            let buffer = this.buffer;
            buffer[pixelOffset + 3] = white;
        }
    }

    /**
     * Create a new NeoPixel driver for `numLeds` LEDs.
     * @param pin the pin where the neopixel is connected.
     * @param numLeds number of leds in the strip, eg: 24,30,60,64
     */
    //% blockId="neopixel_create" block="Create %numLeds lights on %pin using %mode type"
    //% group="Basic Light Control"
    //% weight=100 blockGap=8
    //% parts="neopixel"
    //% trackArgs=0,2
    //% blockSetVariable=strip
    //% pin.defl=DigitalPin.P8
    //% numLeds.defl=4
    export function create(numLeds: number, pin: DigitalPin, mode: NeoPixelMode): Strip {
        let strip = new Strip();
        let stride = mode === NeoPixelMode.RGBW ? 4 : 3;
        strip.buffer = pins.createBuffer(numLeds * stride);
        strip.start = 0;
        strip.length = numLeds;
        strip.mode = mode || NeoPixelMode.RGB;
        strip.matrixWidth = 0;
        strip.setBrightness(128);
        strip.setPin(pin);
        return strip;
    }

    /**
     * Converts red, green, blue channels into a RGB color
     * @param red value of the red channel between 0 and 255. eg: 255
     * @param green value of the green channel between 0 and 255. eg: 255
     * @param blue value of the blue channel between 0 and 255. eg: 255
     */
    //% weight=20 blockGap=8
    //% blockId="neopixel_rgb" block="Red: %red | Green: %green | Blue: %blue"
    //% group="Color Blocks"
    //% weight=20 blockGap=8
    //% red.min=0 red.max=255
    //% green.min=0 green.max=255
    //% blue.min=0 blue.max=255
    export function rgb(red: number, green: number, blue: number): number {
        return packRGB(red, green, blue);
    }

    //% weight=40 blockGap=8
    //% group="Color Blocks"
    //% blockId="pick_color_packrgb" block="Pick color %color"
    //% color.shadow="colorNumberPicker"
    export function pickColorPackRGB(color: number): number {
        const red = unpackR(color);
        const green = unpackG(color);
        const blue = unpackB(color);
        return packRGB(red, green, blue);
    }

    //-------------------------------------색상 블록--------------------------------------
    /**
     * Gets the RGB value of a known color
     */
    //% blockId="neopixel_colors" block="%color"
    //% group="Color Blocks"
    //% weight=30 blockGap=8
    export function getColors(color: NeoPixelColors): number {
        return color;
    }

    function packRGB(red: number, green: number, blue: number): number {
        return ((red & 0xFF) << 16) | ((green & 0xFF) << 8) | (blue & 0xFF);
    }

    function unpackR(rgb: number): number {
        let red = (rgb >> 16) & 0xFF;
        return red;
    }

    function unpackG(rgb: number): number {
        let green = (rgb >> 8) & 0xFF;
        return green;
    }

    function unpackB(rgb: number): number {
        let blue = (rgb) & 0xFF;
        return blue;
    }

    /**
     * Converts a hue saturation luminosity value into a RGB color
     * @param hue hue from 0 to 360
     * @param saturation saturation from 0 to 99
     * @param luminance luminosity from 0 to 99
     */
    //% blockId="neopixel_hsl" block="Hue: %hue | Saturation: %sat | Lightness: %lum"
    //% group="Color Blocks"
    //% weight=15 blockGap=8
    //% hue.min=0 hue.max=360
    //% saturation.min=0 saturation.max=100
    //% luminance.min=0 luminance.max=100
    export function hsl(hue: number, saturation: number, luminance: number): number {
        hue = Math.round(hue);
        saturation = Math.round(saturation);
        luminance = Math.round(luminance);

        hue = hue % 360;
        saturation = Math.clamp(0, 99, saturation);
        luminance = Math.clamp(0, 99, luminance);
        let chroma = Math.idiv((((100 - Math.abs(2 * luminance - 100)) * saturation) << 8), 10000);
        let hueSegment = Math.idiv(hue, 60);
        let hueRemainder = Math.idiv((hue - hueSegment * 60) * 256, 60);
        let temp = Math.abs((((hueSegment % 2) << 8) + hueRemainder) - 256);
        let secondary = (chroma * (256 - temp)) >> 8;
        let red: number;
        let green: number;
        let blue: number;
        if (hueSegment == 0) {
            red = chroma; green = secondary; blue = 0;
        } else if (hueSegment == 1) {
            red = secondary; green = chroma; blue = 0;
        } else if (hueSegment == 2) {
            red = 0; green = chroma; blue = secondary;
        } else if (hueSegment == 3) {
            red = 0; green = secondary; blue = chroma;
        } else if (hueSegment == 4) {
            red = secondary; green = 0; blue = chroma;
        } else if (hueSegment == 5) {
            red = chroma; green = 0; blue = secondary;
        }
        let match = Math.idiv((Math.idiv((luminance * 2 << 8), 100) - chroma), 2);
        red = red + match;
        green = green + match;
        blue = blue + match;
        return packRGB(red, green, blue);
    }

    export enum HueInterpolationDirection {
        Clockwise,
        CounterClockwise,
        Shortest
    }
}