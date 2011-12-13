var stooge = {
    "fn": "Jerome",
    "ln": "Howard",
    "getName": function() { return this.fn + ' ' + this.ln; }
};

console.log(stooge.getName());

var x = stooge;
x.nickname = 'Curly';

delete stooge.fn;

console.log(stooge);

console.log(Object);

if(typeof Object.create !== 'function') {
    Object.create = function (o) {
        var F = function() {};
        F.prototype = o;
        return new F();
    };
}

var another_stooge = Object.create(stooge);

console.log(another_stooge);

var name;
for(name in another_stooge) {
    console.log('another_stooge.' + name + '=' + another_stooge[name]);
}