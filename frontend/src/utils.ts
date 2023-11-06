function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

function validateEmail(email: string) {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}

function isJSONString(err: unknown) {
  try {
    JSON.parse(err as string);
  } catch {
    return false;
  }
  return true;
}

export { classNames, isJSONString, validateEmail };
