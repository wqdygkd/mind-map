const database = require('./database');

const findOneByLogin = async (login) => {
  const users = await database.connection.find({
    login
  });

  return users.length > 0 ? users[0] : null;
};

const authenticate = async (login, password) => {
  const user = await findOneByLogin(login);

  if (user == null) {
    throw new Error('invalid_credentials');
  }

  const doPasswordMatch = password === user.password;

  if (!doPasswordMatch) {
    throw new Error('invalid_credentials');
  }

  return user;
};


module.exports = { authenticate };