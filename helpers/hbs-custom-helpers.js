let order = [];
module.exports = {
  indexIncrement(val) {
    return val + 1;
  },
  ifCond(v1, operator, v2, options) {
    switch (operator) {
      case "||":
        return v1 || v2 ? options.fn(this) : options.inverse(this);
      default:
        return options.inverse(this);
    }
  },
  order,
  incrementor(val) {
    if (val === 0) {
      let nextValue = order.length > 0 ? order[order.length - 1] + 1 : 1;
      order.push(nextValue);
      return nextValue;
    } else {
      let lastElement = order.length > 0 ? order[order.length - 1] : 0;
      let nextValue = lastElement + 1;
      order.push(nextValue);
      return nextValue;
    }
  },resetIndex(){
    order=[];
  },amountMul(val1, val2){
    return val1*val2;

  }
};
