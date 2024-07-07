module.exports = {
  apps: [
    {
      name: "appbank",
      script: "node_modules/.bin/next",
      args: "start",
      cwd: "./", // Directorio de trabajo actual
      instances: "max", // Puedes ajustar el número de instancias según tus necesidades
      exec_mode: "cluster", // Ejecutar en modo cluster para aprovechar múltiples núcleos de CPU
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
