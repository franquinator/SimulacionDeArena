import { SandGrain } from './SandGrain.js';

export class SandGrid {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.grid = [];
        for (let y = 0; y < height; y++) {
            this.grid[y] = [];
            for (let x = 0; x < width; x++) {
                this.grid[y][x] = null;
            }
        }
    }

    addGrain(x, y, color) {
        if (this.inBounds(x, y) && !this.grid[y][x]) {
            this.grid[y][x] = new SandGrain(color);
        }
    }

    inBounds(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    getGrain(x, y) {
        if (this.inBounds(x, y)) {
            return this.grid[y][x];
        }
        return null;
    }

    setGrain(x, y, grain) {
        if (this.inBounds(x, y)) {
            this.grid[y][x] = grain;
        }
    }

    tryMoveGrain(fromX, fromY, toX, toY) {
        if (this.inBounds(toX, toY) && !this.grid[toY][toX]) {
            this.grid[toY][toX] = this.grid[fromY][fromX];
            this.grid[fromY][fromX] = null;
            return true;
        }
        return false;
    }

    tryMoveDown(x, y) {
        return this.tryMoveGrain(x, y, x, y + 1);
    }

    tryMoveDiagonal(x, y) {
        const dirs = [ -1, 1 ];
        if (Math.random() < 0.5) dirs.reverse();
        for (const dir of dirs) {
            if (this.tryMoveGrain(x, y, x + dir, y + 1)) {
                return true;
            }
        }
        return false;
    }

    updatePhysics() {
        let changed = false;
        for (let y = this.height - 2; y >= 0; y--) {
            for (let x = 0; x < this.width; x++) {
                const grain = this.grid[y][x];
                if (!grain || !grain.isActive) continue;

                if (this.tryMoveDown(x, y)) {
                    changed = true;
                    continue;
                }
                if (this.tryMoveDiagonal(x, y)) {
                    changed = true;
                    continue;
                }
                grain.color = 0xffffff;
                grain.isActive = false;
            }
        }
        return changed;
    }
} 