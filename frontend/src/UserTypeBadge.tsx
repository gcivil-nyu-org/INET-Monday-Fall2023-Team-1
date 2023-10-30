import { UserTypes } from "./types";

const UserTypeBadge: React.FunctionComponent<{ userType: UserTypes }> = ({ userType, ...rest }) => {
  if (userType === "sitter") {
    return (
      <span
        className="mr-2 uppercase inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/10"
        {...rest}
      >
        Sitter
      </span>
    );
  }

  return (
    <span
      className="mr-2 uppercase inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20"
      {...rest}
    >
      Owner
    </span>
  );
};

export default UserTypeBadge;
