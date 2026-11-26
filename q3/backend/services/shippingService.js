const STUDENT_ROLL_N = Number(process.env.ROLL_N) || 671;
const FLAT_FEE = 50 + STUDENT_ROLL_N;
const FREE_THRESHOLD = 1000 + STUDENT_ROLL_N;

const computeShipping = (subtotal, itemCount) => {
  if (itemCount === 0 || subtotal >= FREE_THRESHOLD) {
    return 0;
  }
  return FLAT_FEE;
};

const getShippingPolicy = () => {
  return {
    studentN: STUDENT_ROLL_N,
    flatRate: FLAT_FEE,
    freeDeliveryAt: FREE_THRESHOLD
  };
};

module.exports = { computeShipping, getShippingPolicy };
