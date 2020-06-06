import faker from "faker";

function ItemFaker(times = 0) {
  let rows = [];
  for (let i = 0; i < times; i++) {
    rows.push({
      name: faker.name.findName(),
      email: faker.internet.email(),
    });
  }
  return rows;
}

export { ItemFaker };
