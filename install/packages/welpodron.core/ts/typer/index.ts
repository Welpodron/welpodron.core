export type ExtractComponentActions<
  Component = object,
  ActionDeclaration = () => void
> = keyof {
  [Key in keyof Component as Component[Key] extends ActionDeclaration
    ? Key
    : never]: Key;
};
