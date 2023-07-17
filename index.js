const inquirer = require("inquirer");
const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Nojo2679",
  database: "management_db",
});

connection.connect(function (err) {
  if (err) throw err;
  console.log("Connected!");
  startPrompts();
});

const allEmployeesQuery =
  "SELECT EMPLOYEES.ID, EMPLOYEES.FIRST_NAME, EMPLOYEES.LAST_NAME, ROLES.TITLE, ROLES.SALARY, DEPARTMENTS.NAME, (CONCAT(MANAGERS.FIRST_NAME, ' ', MANAGERS.LAST_NAME)) AS MANAGER_NAME FROM EMPLOYEES INNER JOIN ROLES ON EMPLOYEES.ROLE_ID = ROLES.ID INNER JOIN DEPARTMENTS ON ROLES.DEPARTMENT_ID = DEPARTMENTS.ID LEFT JOIN EMPLOYEES AS MANAGERS ON  EMPLOYEES.MANAGER_ID = MANAGERS.ID";
const allDepartmentsQuery = "SELECT ID, NAME FROM DEPARTMENTS";
const departmentNameQuery = "SELECT NAME FROM DEPARTMENTS";
const allRolesQuery =
  "SELECT ROLES.ID, ROLES.TITLE, ROLES.SALARY, DEPARTMENTS.NAME AS DEPARTMENT_NAME FROM ROLES INNER JOIN DEPARTMENTS ON ROLES.DEPARTMENT_ID = DEPARTMENTS.ID";
const roleNamesQuery = "SELECT ROLES.TITLE FROM ROLES";
const managerNamesQuery =
  "SELECT 'None' AS MANAGER_NAME FROM EMPLOYEES WHERE ID = 1 UNION (SELECT CONCAT(EMPLOYEES.FIRST_NAME, ' ', EMPLOYEES.LAST_NAME) AS MANAGER_NAME FROM EMPLOYEES)";
const insertRoleQuery =
  "INSERT INTO ROLES (TITLE, SALARY, DEPARTMENT_ID) VALUES (?, ?, (SELECT ID FROM DEPARTMENTS WHERE NAME = ?))";
const insertEmployeeQuery =
  "INSERT INTO EMPLOYEES (FIRST_NAME, LAST_NAME, ROLE_ID, MANAGER_ID) VALUES (?, ?, (SELECT ID FROM ROLES WHERE TITLE = ?), ?);";
const managerIdQuery =
  "SELECT ID FROM EMPLOYEES WHERE CONCAT(FIRST_NAME, ' ', LAST_NAME) = ?";
const employeeNamesQuery =
  "SELECT CONCAT(EMPLOYEES.FIRST_NAME, ' ', EMPLOYEES.LAST_NAME) AS EMPLOYEE_NAME FROM EMPLOYEES";
const employeeUpdateQuery =
  "UPDATE EMPLOYEES SET ROLE_ID = (SELECT ID FROM ROLES WHERE TITLE = ?) WHERE FIRST_NAME = ? AND LAST_NAME = ?";

const actionQuestion = [
  {
    type: "list",
    name: "starterQuestion",
    message: "What would you like to do?",
    choices: [
      "View all employees",
      "Add employee",
      "Update employee role",
      "View all roles",
      "Add role",
      "View all departments",
      "Add department",
      "Quit",
    ],
  },
];

const departmentQuestion = [
  {
    type: "text",
    name: "departmentNameQuestion",
    message: "What would you like to name the department?",
  },
];

const getAllEmployees = () => {
  connection.query(allEmployeesQuery, (err, results) => {
    if (err) throw err;
    console.table(results);
    startPrompts();
  });
};

const showAllDepartments = () => {
  connection.query(allDepartmentsQuery, (err, results) => {
    if (err) throw err;
    console.table(results);
    startPrompts();
  });
};

const showAllRoles = () => {
  connection.query(allRolesQuery, (err, results) => {
    if (err) throw err;
    console.table(results);
    startPrompts();
  });
};

const addDepartment = async () => {
  const answers = await inquirer.prompt(departmentQuestion);
  let departmentName = answers["departmentNameQuestion"];
  connection.query(
    "INSERT INTO DEPARTMENTS (NAME) VALUES (?)",
    departmentName,
    (err, results) => {
      if (err) throw err;
      console.log("Department added!");
      startPrompts();
    }
  );
};

const addRole = () => {
  connection.query(departmentNameQuery, (err, results) => {
    if (err) throw err;
    inquirer
      .prompt([
        {
          type: "text",
          name: "roleNameQuestion",
          message: "What would you like to name the role?",
        },
        {
          type: "number",
          name: "salaryQuestion",
          message: "What would you like the salary to be?",
        },
        {
          type: "list",
          name: "departmentQuestion",
          message: "Which department do you want to add this role to?",
          choices: results.map((department) => `${department.NAME}`),
        },
      ])
      .then((answers) => {
        let roleName = answers["roleNameQuestion"];
        let departmentName = answers["departmentQuestion"];
        let salary = answers["salaryQuestion"];
        connection.query(
          insertRoleQuery,
          [roleName, salary, departmentName],
          (err, results) => {
            if (err) throw err;
            console.log("Role added!");
            startPrompts();
          }
        );
      });
  });
};

const addEmployee = () => {
  connection.query(roleNamesQuery, (err, results) => {
    if (err) throw err;
    connection.query(managerNamesQuery, (managerErr, managerResults) => {
      if (managerErr) throw managerErr;
      inquirer
        .prompt([
          {
            type: "text",
            name: "firstNameQuestion",
            message: "What's the employee's first name?",
          },
          {
            type: "text",
            name: "lastNameQuestion",
            message: "What's the employee's last name?",
          },
          {
            type: "list",
            name: "roleQuestion",
            message: "What's the employee's role?",
            choices: results.map((role) => `${role.TITLE}`),
          },
          {
            type: "list",
            name: "managerQuestion",
            message: "Which manager is assigned to the employee?",
            choices: managerResults.map((manager) => `${manager.MANAGER_NAME}`),
          },
        ])
        .then((answers) => {
          let firstName = answers["firstNameQuestion"];
          let lastName = answers["lastNameQuestion"];
          let roleName = answers["roleQuestion"];
          let managerName = answers["managerQuestion"];
          let managerId = null;
          if (managerName !== "None") {
            connection.query(
              managerIdQuery,
              managerName,
              (idErr, idResults) => {
                if (idErr) throw idErr;
                managerId = idResults.ID;
              }
            );
          }
          connection.query(
            insertEmployeeQuery,
            [firstName, lastName, roleName, managerId],
            (err, results) => {
              if (err) throw err;
              console.log("Employee added!");
              startPrompts();
            }
          );
        });
    });
  });
};

const updateEmployee = () => {
  connection.query(roleNamesQuery, (err, results) => {
    if (err) throw err;
    connection.query(employeeNamesQuery, (empErr, empResults) => {
      if (empErr) throw empErr;
      inquirer
        .prompt([
          {
            type: "list",
            name: "employeeQuestion",
            message: "Which employee would you like to update?",
            choices: empResults.map((employee) => `${employee.EMPLOYEE_NAME}`),
          },
          {
            type: "list",
            name: "roleQuestion",
            message: "What's the employee's new role?",
            choices: results.map((role) => `${role.TITLE}`),
          },
        ])
        .then((answers) => {
          let employeeName = answers["employeeQuestion"].split(" ");
          let firstName = employeeName[0];
          let lastName = employeeName[1];
          let roleName = answers["roleQuestion"];
          connection.query(
            employeeUpdateQuery,
            [roleName, firstName, lastName],
            (err, results) => {
              if (err) throw err;
              console.log("Employee updated!");
              startPrompts();
            }
          );
        });
    });
  });
};

async function startPrompts() {
  const answers = await inquirer.prompt(actionQuestion);
  let selectedAction = answers["starterQuestion"];
  if (selectedAction === "View all employees") {
    getAllEmployees();
  } else if (selectedAction === "Add employee") {
    addEmployee();
  } else if (selectedAction === "Update employee role") {
    updateEmployee();
  } else if (selectedAction === "View all roles") {
    showAllRoles();
  } else if (selectedAction === "Add role") {
    addRole();
  } else if (selectedAction === "View all departments") {
    showAllDepartments();
  } else if (selectedAction === "Add department") {
    addDepartment();
  } else if (selectedAction === "Quit") {
    connection.end();
  }
}
