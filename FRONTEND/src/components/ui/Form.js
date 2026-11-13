import React from "react";
import clsx from "clsx";

export function Form({
  children,
  onSubmit,
  className = "",
  ...props
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={clsx("flex flex-col gap-5 w-full", className)}
      noValidate
      {...props}
    >
      {children}
    </form>
  );
}
