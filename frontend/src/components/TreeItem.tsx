type TreeItemProp = {
  name: string;
};

const TreeItem = (props: TreeItemProp) => {
  return <div>{props.name}</div>;
};

export default TreeItem;
