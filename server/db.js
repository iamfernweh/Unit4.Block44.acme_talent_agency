const pg = require('pg');
const uuid = require('uuid');
const bcrypt = require('bcrypt');

const client = new pg.Client(
  process.env.DATABASE_URL || 'postgres://localhost/acme_talent_db'
);

//create table
const createTables = async () => {
  const SQL = `
    DROP TABLE IF EXISTS user_skills;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS skills;
    CREATE TABLE users(
      id UUID PRIMARY KEY,
      username VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );
    CREATE TABLE skills(
      id UUID PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL
    );
    CREATE TABLE user_skills(
      id UUID PRIMARY KEY,
      user_id UUID REFERENCES users(id) NOT NULL,
      skill_id UUID REFERENCES skills(id) NOT NULL,
      CONSTRAINT user_skill_unique UNIQUE (user_id, skill_id)
    );
  `;
  await client.query(SQL);
};

//create user
const createUser = async ({ username, password }) => {
  const SQL = `
    INSERT INTO users(id, username, password)
    VALUES($1, $2, $3)
    RETURNING *
  `;
  const response = await client.query(SQL, [
    uuid.v4(),
    username,
    await bcrypt.hash(password, 5),
  ]);
  return response.rows[0];
};

//create user skill
const createUserSkill = async ({ user_id, skill_id }) => {
  const SQL = `
    INSERT INTO user_skills(id, user_id, skill_id)
    VALUES($1, $2, $3)
    RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), user_id, skill_id]);
  return response.rows[0];
};

//create skill
const createSkill = async ({ name }) => {
  const SQL = `
    INSERT INTO skills(id, name)
    VALUES($1, $2)
    RETURNING *
  `;
  const response = await client.query(SQL, [uuid.v4(), name]);
  return response.rows[0];
};

//fetch users
const fetchUsers = async () => {
  const SQL = `
    SELECT *
    FROM users
  `;
  const response = await client.query(SQL);
  return response.rows;
};

//fetch skills
const fetchSkills = async () => {
  const SQL = `
    SELECT *
    FROM skills
  `;
  const response = await client.query(SQL);
  return response.rows;
};

//fetch user skills
const fetchUserSkills = async (user_id) => {
  const SQL = `
    SELECT *
    FROM user_skills 
    WHERE user_id = $1
  `;
  const response = await client.query(SQL, [user_id]);
  return response.rows;
};

//destroy user skill
const destroyUserSkill = async ({ user_id, id }) => {
  const SQL = `
    DELETE FROM user_skills
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `;
  const response = await client.query(SQL, [id, user_id]);
  if (!response.rows.length) {
    const error = Error('no user skill found');
    error.status = 500;
    throw error;
  }
};

module.exports = {
  client,
  createTables,
  createUser,
  fetchUsers,
  createSkill,
  createUserSkill,
  fetchSkills,
  fetchUserSkills,
  destroyUserSkill,
};
