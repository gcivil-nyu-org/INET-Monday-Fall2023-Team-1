function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

function validateEmail(email: string) {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}

export { classNames, validateEmail };
