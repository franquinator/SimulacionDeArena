import { SandGrid } from './SandGrid.js';

export class SandApp {
    constructor() {
        this.width = 400;
        this.height = 400;
        this.gridWidth = 200;
        this.gridHeight = 200;
        this.pixelSize = 2;
        this.sandColors = [
            0xFFD700, // Amarillo
            0xFF8000, // Naranja
            0x00CFFF, // Azul
            0x00FF00, // Verde
            0xFF00FF, // Magenta
            0xFFFFFF, // Blanco
            0xA0522D, // Marrón
        ];
        this.selectedColor = this.sandColors[0];
        this.mouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.sandGrid = new SandGrid(this.gridWidth, this.gridHeight);
        this.brushSize = 1;
        this.tool = 'brush'; // 'brush' o 'eraser'
        this.needsRedraw = true; // Flag para optimización
        this.initPixi();
        this.initUI();
    }

    async initPixi() {
        this.app = new PIXI.Application();
        await this.app.init({ width: this.width, height: this.height });
        window.__PIXI_APP__ = this.app;
        document.body.appendChild(this.app.canvas);
        this.graphics = new PIXI.Graphics();
        this.app.stage.addChild(this.graphics);
        this.app.ticker.add(() => {
            const userChanged = this.handleInput();
            const physicsChanged = this.sandGrid.updatePhysics();
            if (userChanged || physicsChanged || this.needsRedraw) {
                this.draw();
                this.needsRedraw = false;
            }
        });
        this.app.view.addEventListener('pointerdown', (e) => {
            this.mouseDown = true;
            this.updateMousePosition(e);
        });
        this.app.view.addEventListener('pointerup', () => {
            this.mouseDown = false;
        });
        this.app.view.addEventListener('pointerleave', () => {
            this.mouseDown = false;
        });
        this.app.view.addEventListener('pointermove', (e) => {
            this.updateMousePosition(e);
        });
    }

    initUI() {
        this.colorBar = document.getElementById('colorBar');
        this.colorBar.innerHTML = '';
        this.sandColors.forEach(color => {
            const btn = document.createElement('button');
            btn.style.background = '#' + color.toString(16).padStart(6, '0');
            btn.style.width = '32px';
            btn.style.height = '32px';
            btn.style.border = '2px solid #333';
            btn.style.cursor = 'pointer';
            btn.onclick = () => {
                this.selectedColor = color;
                this.tool = 'brush'; // Cambia a pincel al elegir color
                this.updateColorBarSelection();
                this.updateToolButtons();
            };
            this.colorBar.appendChild(btn);
        });
        this.updateColorBarSelection();

        // Crear control de tamaño de pincel
        let brushContainer = document.getElementById('brushContainer');
        if (!brushContainer) {
            brushContainer = document.createElement('div');
            brushContainer.id = 'brushContainer';
            brushContainer.style.margin = '10px';
            brushContainer.style.display = 'flex';
            brushContainer.style.alignItems = 'center';
            brushContainer.style.gap = '10px';
            this.colorBar.parentNode.insertBefore(brushContainer, this.colorBar.nextSibling);
        }
        brushContainer.innerHTML = '';
        const label = document.createElement('label');
        label.textContent = 'Tamaño de pincel:';
        label.htmlFor = 'brushSizeRange';
        const range = document.createElement('input');
        range.type = 'range';
        range.min = '1';
        range.max = '10';
        range.value = this.brushSize;
        range.id = 'brushSizeRange';
        range.style.verticalAlign = 'middle';
        range.oninput = (e) => {
            this.brushSize = parseInt(e.target.value);
            valueSpan.textContent = this.brushSize;
        };
        const valueSpan = document.createElement('span');
        valueSpan.textContent = this.brushSize;
        brushContainer.appendChild(label);
        brushContainer.appendChild(range);
        brushContainer.appendChild(valueSpan);

        // Botones de herramienta (pincel y goma)
        let toolContainer = document.getElementById('toolContainer');
        if (!toolContainer) {
            toolContainer = document.createElement('div');
            toolContainer.id = 'toolContainer';
            toolContainer.style.margin = '10px';
            toolContainer.style.display = 'flex';
            toolContainer.style.alignItems = 'center';
            toolContainer.style.gap = '10px';
            brushContainer.parentNode.insertBefore(toolContainer, brushContainer.nextSibling);
        }
        toolContainer.innerHTML = '';
        const brushBtn = document.createElement('button');
        brushBtn.textContent = '🖌️ Pincel';
        brushBtn.onclick = () => {
            this.tool = 'brush';
            this.updateToolButtons();
        };
        const eraserBtn = document.createElement('button');
        eraserBtn.textContent = '🧹 Goma';
        eraserBtn.onclick = () => {
            this.tool = 'eraser';
            this.updateToolButtons();
        };
        toolContainer.appendChild(brushBtn);
        toolContainer.appendChild(eraserBtn);
        this.updateToolButtons();
    }

    updateToolButtons() {
        const toolContainer = document.getElementById('toolContainer');
        if (!toolContainer) return;
        const [brushBtn, eraserBtn] = toolContainer.children;
        if (brushBtn) brushBtn.style.outline = this.tool === 'brush' ? '3px solid #fff' : '';
        if (eraserBtn) eraserBtn.style.outline = this.tool === 'eraser' ? '3px solid #fff' : '';
    }

    updateColorBarSelection() {
        Array.from(this.colorBar.children).forEach((btn, i) => {
            btn.style.outline = (this.sandColors[i] === this.selectedColor) ? '3px solid #fff' : '';
        });
    }

    updateMousePosition(e) {
        const rect = this.app.view.getBoundingClientRect();
        this.mouseX = Math.floor((e.clientX - rect.left) / this.pixelSize);
        this.mouseY = Math.floor((e.clientY - rect.top) / this.pixelSize);
    }

    handleInput() {
        let changed = false;
        if (this.mouseDown) {
            const half = Math.floor(this.brushSize / 2);
            for (let dy = -half; dy <= half; dy++) {
                for (let dx = -half; dx <= half; dx++) {
                    const x = this.mouseX + dx;
                    const y = this.mouseY + dy;
                    if (
                        x >= 0 && x < this.gridWidth &&
                        y >= 0 && y < this.gridHeight
                    ) {
                        if (this.tool === 'brush') {
                            if (!this.sandGrid.getGrain(x, y)) {
                                this.sandGrid.addGrain(x, y, this.selectedColor);
                                changed = true;
                            }
                        } else if (this.tool === 'eraser') {
                            if (this.sandGrid.getGrain(x, y)) {
                                this.sandGrid.setGrain(x, y, null);
                                changed = true;
                            }
                        }
                    }
                }
            }
        }
        if (changed) this.needsRedraw = true;
        return changed;
    }

    draw() {
        this.graphics.clear();
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const grain = this.sandGrid.getGrain(x, y);
                if (grain) {
                    this.graphics.beginFill(grain.color);
                    this.graphics.drawRect(x * this.pixelSize, y * this.pixelSize, this.pixelSize, this.pixelSize);
                    this.graphics.endFill();
                }
            }
        }
    }
} 