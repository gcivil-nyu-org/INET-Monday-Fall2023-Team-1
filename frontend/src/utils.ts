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

const getCurrentAge = (date: string) => {
  const today = new Date();
  const dob = new Date(date);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Math.floor(((today as any) - (dob as any)) / 31557600000);
};

export { classNames, getCurrentAge, isJSONString, validateEmail };
