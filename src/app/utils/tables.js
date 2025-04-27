"use client";

export const TableTypes = {
    CIRCLE: "TABLE_CIRCLE"
}

export class BaseTable {
    constructor(x, y, shape, holding, maxHolding){
        this.holding = holding;
        this.maxHolding = maxHolding;
        this.shape = shape; //TableTypes.CIRCLE
        this.parent = null; //create tables without parents add them later
        this.x = x;
        this.y = y;
        this.dragging = false;
    }

    mouseMove(mouseUpdateEvent, attachedCanvas){
        if(this.dragging){
            const bb = attachedCanvas.getBoundingClientRect();
            this.x = (mouseUpdateEvent.clientX - bb.left) * (attachedCanvas.width/bb.width);
            this.y = (mouseUpdateEvent.clientY - bb.top) * (attachedCanvas.width/bb.width);
            this.parent.render();
        }
    }

    isBounding(mouseUpdateEvent, attachedCanvas){
        throw new Error("abstract method");
    }

    render(drawContext){
        throw new Error("abstract method");
    }
}

export class CircularTable extends BaseTable {
    constructor(x, y, diameter, holding, maxHolding){
        super(x, y, TableTypes.CIRCLE, holding, maxHolding);

        this.diameter = diameter;
    }

    isBounding(mouseUpdateEvent, attachedCanvas){
        const bb = attachedCanvas.getBoundingClientRect();
        const x0 = (mouseUpdateEvent.clientX - bb.left) * (attachedCanvas.width/bb.width);
        const y0 = (mouseUpdateEvent.clientY - bb.top) * (attachedCanvas.width/bb.width);

        const dx = Math.abs(this.x-x0);
        const dy = Math.abs(this.y-y0);
        const norm = Math.sqrt(dx*dx + dy*dy);
        return norm < 50;
    }

    render(drawContext){
        drawContext.beginPath();
        drawContext.arc(this.x, this.y, this.diameter, 0, 2 * Math.PI);
        drawContext.fillStyle = "#737373";
        drawContext.fill();
        drawContext.lineWidth = 4;
        drawContext.strokeStyle = "#333333";
        drawContext.stroke();

        drawContext.fillStyle = "black";
        drawContext.font = "15px monospace";
        drawContext.textAlign = "center"
        drawContext.fillText(this.maxHolding, this.x, this.y+(5));
    }
    
}


export class SquareTable extends BaseTable {
    constructor(x, y, width, height, holding, maxHolding){
        super(x, y, TableTypes.CIRCLE, holding, maxHolding);

        this.width = width;
        this.height = height;
    }

    isBounding(mouseUpdateEvent, attachedCanvas){
        const bb = attachedCanvas.getBoundingClientRect();
        const x0 = (mouseUpdateEvent.clientX - bb.left) * (attachedCanvas.width/bb.width);
        const y0 = (mouseUpdateEvent.clientY - bb.top) * (attachedCanvas.width/bb.width);

        const dx = Math.abs(this.x-x0);
        const dy = Math.abs(this.y-y0);
        const norm = Math.sqrt(dx*dx + dy*dy);
        return norm < this.diameter/2;
    }

    render(drawContext){
        drawContext.beginPath();
        drawContext.arc(this.x, this.y, this.diameter, 0, 2 * Math.PI);
        drawContext.fillStyle = "#737373";
        drawContext.fill();
        drawContext.lineWidth = 4;
        drawContext.strokeStyle = "#333333";
        drawContext.stroke();

        drawContext.fillStyle = "black";
        drawContext.font = "15px monospace";
        drawContext.textAlign = "center"
        drawContext.fillText(this.maxHolding, this.x, this.y+(5));
    }
    
}


export class TableCanvas {
    constructor(tables){
        this.tables = tables;
        this.blockMovement = false;
        for(const table of this.tables){
            table.parent = this;
        }
    }

    static deserializeAndLock(tables){
        const tableObjs = [];
        for(const table of tables){
            tableObjs.push(new CircularTable(table['x'], table['y'], table['size']*3, 0, table['size']))
        }
        this.blockMovement = true;
        return tableObjs;
    }

    serialize(){
        const tableJson = [];
        for(const table of this.tables){
            tableJson.push({x:table.x, y:table.y, size:table.maxHolding})
        }
    }

    addTable(table){
        this.tables.push(table);
        table.parent = this;
    }

    initHtml(htmlElement){
        console.log("[canvas] inithtml");
        this.cv = htmlElement;
        this.drawContext = this.cv.getContext("2d");

        let dpi = window.devicePixelRatio;
        let style_height = +getComputedStyle(this.cv).getPropertyValue("height").slice(0, -2);
        let style_width = +getComputedStyle(this.cv).getPropertyValue("width").slice(0, -2);

        this.cv.setAttribute('height', style_height * dpi);
        this.cv.setAttribute('width', style_width * dpi);

        this.cv.addEventListener('mousedown', (e)=>{
            this.mouseDown(e);
        });
        
        this.cv.addEventListener('mouseup', (e)=>{
            this.mouseUp(e);
        });

        this.cv.addEventListener('mousemove', (e)=>{
            this.mouseMove(e);
        });
    }

    mouseDown(event){
        if(this.blockMovement) return 0;
        for(const table of this.tables){
            if(table.isBounding(event, this.cv)){
                table.dragging = true;
                table.mouseMove(event, this.cv);
                this.render();
                break;
            }
        }
    }

    mouseUp(event){
        for(const table of this.tables){
            table.dragging = false;
        }
    }

    mouseMove(event){
        for(const table of this.tables){
            table.mouseMove(event, this.cv);
        }
    }


    render(){
        this.drawContext.clearRect(0, 0, this.cv.width, this.cv.height);
        for(const table of this.tables){
            table.render(this.drawContext);
        }
    }
}