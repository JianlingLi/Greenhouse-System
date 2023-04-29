import { React } from 'react';

const Temperature = ({ data }) => {
  return (
    <div>
      <h3>Temperature</h3>
      <p>{data}</p>
    </div>
  );
};

export default Temperature;

/*
const ShoppingList = (props) => {
    return (
      <div>
        {props.itemsInList.map((item)=>
          <label htmlFor="checkbox-1" key={item}>
            <input type="checkbox" name="checkbox-1" role="switch" />
            {item}
          </label>
        )}
      </div>
    )
}

export default ShoppingList;*/