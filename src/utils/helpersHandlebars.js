const helpers = {
    eq: function (a, b) {
        return a === b;
    },
    gt: function (a, b) {
        return a > b;
    },
    lt: function (a, b) {
        return a < b;
    },
    add: function (a, b) {
        return a + b;
    },
    subtract: function (a, b) {
        return a - b;
    },
    multiply: function (a, b) {
        return a * b;
    },
    formatPrice: function (price) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS'
        }).format(price);
    },
    range: function(start, end) {
        const result = [];
        for (let i = start; i <= end; i++) {
            result.push(i);
        }
        return result;
    },
    reduce: function(array, fn) {
        return array.reduce((acc, currentItem) => {
            return acc + (currentItem.price * currentItem.quantity);
        }, 0);
    },
    total: function(products) {
        return products.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    },
    lambda: function(params, body) {
        const paramList = params.split(',').map(p => p.trim());
        return new Function(...paramList, `return ${body}`);
    }
};

export default helpers;
