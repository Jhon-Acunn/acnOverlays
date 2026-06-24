export function initCombo() {
  const ids = ['dualBothToggle', 'sponsorToggle', 'tkrToggle'];
  function flipAll(on) {
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const shouldBe = on;
      if (el.checked !== shouldBe) {
        el.checked = shouldBe;
        el.dispatchEvent(new Event('change'));
      }
    });
  }
  document.getElementById('comboToggle')?.addEventListener('change', function () {
    flipAll(this.checked);
  });
  document.getElementById('qpShowAll')?.addEventListener('click', () => {
    const qp = document.getElementById('qpComboToggle');
    if (qp && !qp.checked) {
      qp.checked = true;
      qp.dispatchEvent(new Event('change'));
    }
  });
  document.getElementById('qpHideAll')?.addEventListener('click', () => {
    const qp = document.getElementById('qpComboToggle');
    if (qp && qp.checked) {
      qp.checked = false;
      qp.dispatchEvent(new Event('change'));
    }
  });
}


