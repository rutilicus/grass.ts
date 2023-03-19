function stdOut(str) {
  document.getElementById('stdout').value =
    document.getElementById('stdout').value + str;
}

function stdErr(str) {
  document.getElementById('stderr').value =
    document.getElementById('stderr').value + str;
}

document.getElementById('exec_button').addEventListener('click', () => {
  document.getElementById('stdout').value = ''
  document.getElementById('stderr').value = ''
  Grass.main(document.getElementById('code').value,
             document.getElementById('stdin').value,
             stdOut,
             stdErr);
});
