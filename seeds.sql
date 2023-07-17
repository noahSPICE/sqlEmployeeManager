INSERT INTO departments (id, name)
VALUES (1, 'Sales');

INSERT INTO roles (id, title, salary, department_id)
VALUES (1, 'Salesman', 50000, 1);

INSERT INTO employees (id, first_name, last_name, role_id, manager_id)
VALUES (1, 'Harry', 'Potter', 1, null);

INSERT INTO EMPLOYEES (FIRST_NAME, LAST_NAME, ROLE_ID, MANAGER_ID) 
VALUES ('DAMIAN', 'LILLARD', 1, 1);