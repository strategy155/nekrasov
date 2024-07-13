interface MenuElement {
  name: string;
}

interface MenuButtonProperties extends MenuElement {
  dispatchFunction: () => void;
}

function MenuButton(props: MenuButtonProperties) {
  return <button onClick={props.dispatchFunction} />;
}

export { MenuButton };
