const STORAGE_KEY = "contacthub_contacts_v1";

let contacts = loadContactsFromStorage();

const contactModalEl = document.getElementById("contactModal");
const contactModal = contactModalEl
  ? new bootstrap.Modal(contactModalEl)
  : null;
const contactForm = document.getElementById("contactForm");
const contactModalLabel = document.getElementById("contactModalLabel");

const contactIdInput = document.getElementById("contactId");
const contactNameInput = document.getElementById("contactName");
const contactPhoneInput = document.getElementById("contactPhone");
const contactEmailInput = document.getElementById("contactEmail");
const contactAddressInput = document.getElementById("contactAddress");
const contactGroupInput = document.getElementById("contactGroup");
const contactNotesInput = document.getElementById("contactNotes");
const isFavoriteInput = document.getElementById("isFavorite");
const isEmergencyInput = document.getElementById("isEmergency");

const contactPhotoInput = document.getElementById("contactPhotoInput");
const changePhotoBtn = document.getElementById("changePhotoBtn");
const avatarPreviewImg = document.getElementById("avatarPreviewImg");
const avatarDefaultIcon = document.getElementById("avatarDefaultIcon");

let currentAvatarDataUrl = "";

const searchInput = document.getElementById("searchInput");

const totalCountEl = document.getElementById("totalCount");
const favCountEl = document.getElementById("favCount");
const emergencyCountEl = document.getElementById("emergencyCount");
const contactsSubtitleCountEl = document.getElementById(
  "contactsSubtitleCount",
);

const emptyStateBox = document.getElementById("emptyStateBox");
const emptyStateTitle = document.getElementById("emptyStateTitle");
const emptyStateSubtitle = document.getElementById("emptyStateSubtitle");
const contactsCardsList = document.getElementById("contactsCardsList");
const contactCardTemplate = document.getElementById("contactCardTemplate");

const favoritesListEl = document.getElementById("favoritesList");
const emergencyListEl = document.getElementById("emergencyList");

function loadContactsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveContactsToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
  } catch (error) {}
}

function setAvatarPreview(dataUrl) {
  currentAvatarDataUrl = dataUrl || "";

  if (!avatarPreviewImg || !avatarDefaultIcon) return;

  if (currentAvatarDataUrl) {
    avatarPreviewImg.src = currentAvatarDataUrl;
    avatarPreviewImg.classList.remove("d-none");
    avatarDefaultIcon.classList.add("d-none");
  } else {
    avatarPreviewImg.src = "";
    avatarPreviewImg.classList.add("d-none");
    avatarDefaultIcon.classList.remove("d-none");
  }
}

function clearValidationErrors() {
  [contactNameInput, contactPhoneInput, contactEmailInput].forEach((input) => {
    if (input) {
      input.classList.remove("is-invalid");
    }
  });
}

function resetContactForm() {
  if (!contactForm) return;
  contactForm.reset();
  if (contactIdInput) contactIdInput.value = "";
  if (contactModalLabel) contactModalLabel.textContent = "Add New Contact";
  setAvatarPreview("");
  clearValidationErrors();
}

if (changePhotoBtn && contactPhotoInput) {
  changePhotoBtn.addEventListener("click", () => {
    contactPhotoInput.click();
  });

  contactPhotoInput.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "warning",
        title: "Invalid File",
        text: "Please select a valid image file.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(String(reader.result || ""));
    };
    reader.readAsDataURL(file);
  });
}

if (contactModalEl) {
  contactModalEl.addEventListener("show.bs.modal", (event) => {
    const triggerBtn = event.relatedTarget;
    if (triggerBtn && triggerBtn.matches('[data-bs-target="#contactModal"]')) {
      resetContactForm();
    }
  });
}

function validateContactForm(name, phone, email) {
  clearValidationErrors();
  let isValid = true;

  if (!name) {
    contactNameInput.classList.add("is-invalid");
    isValid = false;
  }

  const cleanPhone = phone.replace(/[\s()-]/g, "");
  if (!cleanPhone || !/^\+?\d{6,15}$/.test(cleanPhone)) {
    contactPhoneInput.classList.add("is-invalid");
    isValid = false;
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    contactEmailInput.classList.add("is-invalid");
    isValid = false;
  }

  return isValid;
}

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = (contactNameInput?.value || "").trim();
    const phone = (contactPhoneInput?.value || "").trim();
    const email = (contactEmailInput?.value || "").trim();
    const address = (contactAddressInput?.value || "").trim();
    const group = contactGroupInput?.value || "";
    const notes = (contactNotesInput?.value || "").trim();
    const isFavorite = Boolean(isFavoriteInput?.checked);
    const isEmergency = Boolean(isEmergencyInput?.checked);
    const existingId = (contactIdInput?.value || "").trim();

    if (!validateContactForm(name, phone, email)) {
      return;
    }

    if (existingId) {
      contacts = contacts.map((item) =>
        item.id === existingId
          ? {
              ...item,
              name,
              phone,
              email,
              address,
              group,
              notes,
              isFavorite,
              isEmergency,
              avatar: currentAvatarDataUrl,
            }
          : item,
      );
    } else {
      const newContact = {
        id: String(Date.now()),
        name,
        phone,
        email,
        address,
        group,
        notes,
        isFavorite,
        isEmergency,
        avatar: currentAvatarDataUrl,
      };
      contacts.unshift(newContact);
    }

    saveContactsToStorage();
    renderAll();

    if (contactModal) {
      contactModal.hide();
    }

    Swal.fire({
      icon: "success",
      title: existingId ? "Contact Updated" : "Contact Saved",
      timer: 1400,
      showConfirmButton: false,
    });
  });
}

function getFirstLetter(name = "") {
  const trimmed = name.trim();
  return trimmed ? trimmed[0].toUpperCase() : "?";
}

function updateStats(filteredCount = contacts.length) {
  const favTotal = contacts.filter((c) => c.isFavorite).length;
  const emergencyTotal = contacts.filter((c) => c.isEmergency).length;

  if (totalCountEl) totalCountEl.textContent = String(contacts.length);
  if (favCountEl) favCountEl.textContent = String(favTotal);
  if (emergencyCountEl) emergencyCountEl.textContent = String(emergencyTotal);
  if (contactsSubtitleCountEl) {
    contactsSubtitleCountEl.textContent = String(filteredCount);
  }
}

function getFilteredContacts() {
  const query = (searchInput?.value || "").trim().toLowerCase();
  if (!query) return contacts;

  return contacts.filter((c) => {
    const name = (c.name || "").toLowerCase();
    const phone = (c.phone || "").toLowerCase();
    const email = (c.email || "").toLowerCase();
    const group = (c.group || "").toLowerCase();
    return (
      name.includes(query) ||
      phone.includes(query) ||
      email.includes(query) ||
      group.includes(query)
    );
  });
}

function createContactCardFromTemplate(contact) {
  const fragment = contactCardTemplate.content.cloneNode(true);
  const col = fragment.firstElementChild;
  col.dataset.id = contact.id;

  const avatarImg = col.querySelector(".card-avatar-img");
  const avatarLetter = col.querySelector(".card-avatar-letter");

  if (contact.avatar) {
    avatarImg.src = contact.avatar;
    avatarImg.alt = contact.name;
    avatarImg.classList.remove("d-none");
    avatarLetter.classList.add("d-none");
  } else {
    avatarLetter.textContent = getFirstLetter(contact.name);
  }

  col.querySelector(".card-contact-name").textContent = contact.name;
  col.querySelector(".card-contact-phone").textContent = contact.phone;

  const emailRow = col.querySelector(".card-email-row");
  if (contact.email) {
    emailRow.classList.remove("d-none");
    col.querySelector(".card-contact-email").textContent = contact.email;
  }

  const addressRow = col.querySelector(".card-address-row");
  if (contact.address) {
    addressRow.classList.remove("d-none");
    col.querySelector(".card-contact-address").textContent = contact.address;
  }

  const groupBadge = col.querySelector(".card-group-badge");
  if (contact.group) {
    groupBadge.classList.remove("d-none");
    groupBadge.textContent = contact.group;
  }

  const callBtn = col.querySelector(".action-call-btn");
  callBtn.href = `tel:${contact.phone}`;

  const mailBtn = col.querySelector(".action-mail-btn");
  if (contact.email) {
    mailBtn.href = `mailto:${contact.email}`;
  } else {
    mailBtn.href = "#";
  }

  const favBtn = col.querySelector(".action-fav-btn");
  favBtn.dataset.id = contact.id;
  if (contact.isFavorite) {
    favBtn.classList.add("is-active");
  }

  const emergBtn = col.querySelector(".action-emerg-btn");
  emergBtn.dataset.id = contact.id;
  if (contact.isEmergency) {
    emergBtn.classList.add("is-active");
  }

  col.querySelector(".action-edit-btn").dataset.id = contact.id;
  col.querySelector(".action-delete-btn").dataset.id = contact.id;

  return col;
}

function renderContacts(list) {
  if (!contactsCardsList || !emptyStateBox || !contactCardTemplate) return;

  contactsCardsList.replaceChildren();

  if (list.length === 0) {
    const hasSearch = Boolean((searchInput?.value || "").trim());
    contactsCardsList.classList.add("d-none");
    emptyStateBox.classList.remove("d-none");

    if (emptyStateTitle) {
      emptyStateTitle.textContent = hasSearch
        ? "No matching contacts"
        : "No contacts found";
    }
    if (emptyStateSubtitle) {
      emptyStateSubtitle.textContent = hasSearch
        ? "Try searching with a different name, phone, or email."
        : 'Click "Add Contact" to get started';
    }
    return;
  }

  emptyStateBox.classList.add("d-none");
  contactsCardsList.classList.remove("d-none");

  list.forEach((contact) => {
    contactsCardsList.appendChild(createContactCardFromTemplate(contact));
  });
}

function renderSideList(container, items, emptyMessage) {
  if (!container) return;
  container.replaceChildren();

  if (items.length === 0) {
    container.className = "side-panel-body side-empty-text text-center";
    container.textContent = emptyMessage;
    return;
  }

  container.className = "side-panel-body d-flex flex-column gap-2";

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className =
      "d-flex justify-content-between align-items-center p-2 rounded-3 bg-light";

    const textBox = document.createElement("div");
    textBox.className = "min-w-0";

    const nameEl = document.createElement("div");
    nameEl.className = "fw-semibold small text-dark text-truncate";
    nameEl.textContent = item.name;

    const phoneEl = document.createElement("div");
    phoneEl.className = "text-muted";
    phoneEl.style.fontSize = "0.78rem";
    phoneEl.textContent = item.phone;

    textBox.appendChild(nameEl);
    textBox.appendChild(phoneEl);
    row.appendChild(textBox);
    container.appendChild(row);
  });
}

function renderSidePanels() {
  renderSideList(
    favoritesListEl,
    contacts.filter((c) => c.isFavorite),
    "No favorites yet",
  );
  renderSideList(
    emergencyListEl,
    contacts.filter((c) => c.isEmergency),
    "No emergency contacts",
  );
}

function renderAll() {
  const filtered = getFilteredContacts();
  updateStats(filtered.length);
  renderContacts(filtered);
  renderSidePanels();
}

function toggleFavorite(id) {
  contacts = contacts.map((c) =>
    c.id === id ? { ...c, isFavorite: !c.isFavorite } : c,
  );
  saveContactsToStorage();
  renderAll();
}

function toggleEmergency(id) {
  contacts = contacts.map((c) =>
    c.id === id ? { ...c, isEmergency: !c.isEmergency } : c,
  );
  saveContactsToStorage();
  renderAll();
}

function openEditContact(id) {
  const target = contacts.find((c) => c.id === id);
  if (!target || !contactModal) return;

  resetContactForm();
  if (contactModalLabel) contactModalLabel.textContent = "Edit Contact";
  if (contactIdInput) contactIdInput.value = target.id;
  if (contactNameInput) contactNameInput.value = target.name || "";
  if (contactPhoneInput) contactPhoneInput.value = target.phone || "";
  if (contactEmailInput) contactEmailInput.value = target.email || "";
  if (contactAddressInput) contactAddressInput.value = target.address || "";
  if (contactGroupInput) contactGroupInput.value = target.group || "";
  if (contactNotesInput) contactNotesInput.value = target.notes || "";
  if (isFavoriteInput) isFavoriteInput.checked = Boolean(target.isFavorite);
  if (isEmergencyInput) isEmergencyInput.checked = Boolean(target.isEmergency);

  setAvatarPreview(target.avatar || "");
  contactModal.show();
}

function deleteContact(id) {
  const target = contacts.find((c) => c.id === id);
  if (!target) return;

  Swal.fire({
    title: "Delete Contact?",
    text: `Are you sure you want to delete "${target.name}"?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#64748b",
    confirmButtonText: "Yes, delete it",
  }).then((result) => {
    if (result.isConfirmed) {
      contacts = contacts.filter((c) => c.id !== id);
      saveContactsToStorage();
      renderAll();

      Swal.fire({
        icon: "success",
        title: "Deleted",
        timer: 1200,
        showConfirmButton: false,
      });
    }
  });
}

if (contactsCardsList) {
  contactsCardsList.addEventListener("click", (event) => {
    const favBtn = event.target.closest(".action-fav-btn");
    if (favBtn) {
      toggleFavorite(favBtn.dataset.id);
      return;
    }

    const emergBtn = event.target.closest(".action-emerg-btn");
    if (emergBtn) {
      toggleEmergency(emergBtn.dataset.id);
      return;
    }

    const editBtn = event.target.closest(".action-edit-btn");
    if (editBtn) {
      openEditContact(editBtn.dataset.id);
      return;
    }

    const deleteBtn = event.target.closest(".action-delete-btn");
    if (deleteBtn) {
      deleteContact(deleteBtn.dataset.id);
    }
  });
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    renderAll();
  });
}

renderAll();
