// based on http://codepen.io/jackrugile/pen/fatJA

LDR.LoveButtonFountainView = Backbone.View.extend({
    tagName: 'canvas',
    initialize: function(options){
        var that = this;
        this.count = options.count || 100;

        this.c = this.el;
        this.ctx = this.c.getContext('2d');
        this.cw = this.c.width = $(window).width();
        this.ch = this.c.height = 500;
        this.rand = function(a,b){return ~~((Math.random()*(b-a+1))+a);};
        this.plusses = [];
        this.tick = 3;
        this.tickMax = 3;

        this.Plus = function(){
            this.init();
        };

        this.Plus.prototype.init = function(){
            this.x = that.cw/2;
            this.y = that.ch * 0.7;
            this.vx = (that.rand(0, 100)-50)/12;
            this.vy = -(that.rand(50, 100))/9;
            this.lightness = that.rand(0, 50);
            this.alpha = 0.1;
            this.fade = 0.03;
            this.scale = 0.2;
            this.growth = 0.06;
            this.rotation = that.rand(0, Math.PI*2);
            this.spin = (that.rand(0, 100)-50)/300;
            this.visible = true;
        };

        this.Plus.prototype.update = function(i){
            this.x += this.vx;
            this.y += this.vy;
            this.vy += 0.15 * this.scale;
            if(this.alpha < 1){
                this.alpha += this.fade;
            }
            this.scale += this.growth;
            this.rotation += this.spin;

            if(this.y-30 >= that.ch){
                // this.init();
                this.visible = false;
            }
        };

        this.Plus.prototype.render = function(){
            that.ctx.save();
            that.ctx.translate(this.x, this.y);
            that.ctx.scale(this.scale, this.scale);
            that.ctx.rotate(this.rotation);

            that.ctx.fillStyle = 'hsla(0, 0%, '+this.lightness+'%, '+this.alpha+')';
            

            var path = new Path2D();
            

            var curves = [
                [70,40],
                [75,37,70,25,50,25],
                [20,25,20,62.5,20,62.5],
                [20,80,40,102,75,120],
                [110,102,130,80,130,62.5],
                [130,62.5,130,25,100,25],
                [85,25,75,37,75,40]
            ];

            // manipulate the curves
            curves = _.map(curves, function(curve){
                return _.map(curve, function(item){
                    return item / 15 -5;
                });
            });

            path.moveTo.apply(path, curves[0]);

            _.each(curves.splice(1), function(curve){
                path.bezierCurveTo.apply(path, curve);
            });
            
            that.ctx.fill(path);

            that.ctx.restore();
        };


    },

    createPlusses: function(){
        if(this.plusses.length < this.count){
            if(this.tick >= this.tickMax){
                this.plusses.push(new this.Plus());
                this.tick = 0;
            } else {
                this.tick++;
            }
        } else{
            var all_plusses_invisible = _.findIndex(this.plusses, function(plus){ return plus.visible; }) === -1;
            if(all_plusses_invisible){
                this.stop();
                this.remove();
            }
        }
    },

    updatePlusses: function(){
        var i = this.plusses.length;
        while(i--){
            this.plusses[i].update(i);
        }
    },

    renderPlusses: function(){
        var i = this.plusses.length;
        while(i--){
            this.plusses[i].render();
        }
    },

    loop: function(){
        this.requestId = requestAnimFrame(this.loop.bind(this));
        this.ctx.clearRect(0, 0, this.cw, this.ch);
        this.createPlusses();
        this.updatePlusses();
        this.renderPlusses();
    },
    render: function(){
        if(!this.requestId){
            this.loop();
        }
        return this;
    },
    stop: function(){
        console.log("STOPPING");
        if (this.requestId) {
           window.cancelAnimationFrame(this.requestId);
           this.requestId = undefined;
        }
        this.trigger('stop');
    }
});