<template>
  <div class="container py-5">
    <h1 class="mb-4">PlayOnline Accounts</h1>

    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">{{ editing ? "Edit Account" : "Add New Account" }}</h5>
        <form @submit.prevent="saveEntry">
          <div class="mb-3">
            <label for="polId" class="form-label">POL ID</label>
            <input id="polId" v-model="form.polId" type="text" class="form-control" required autocomplete="off" />
          </div>
          <div class="mb-3">
            <label for="handle" class="form-label">Handle</label>
            <input id="handle" v-model="form.handle" type="text" class="form-control" required autocomplete="off" />
          </div>
          <div class="mb-3">
            <label for="sqAcc" class="form-label">SQ ACC</label>
            <input id="sqAcc" v-model="form.sqAcc" type="text" class="form-control" required autocomplete="off" />
          </div>
          <div class="form-check mb-3">
            <input id="twoFA" v-model="form.twoFA" type="checkbox" class="form-check-input" />
            <label for="twoFA" class="form-check-label">2FA Enabled</label>
          </div>
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save"></i> {{ editing ? "Update" : "Add" }}
          </button>
          <button v-if="editing" type="button" class="btn btn-secondary ms-2" @click="cancelEdit">Cancel</button>
        </form>
      </div>
    </div>

    <table class="table table-striped table-hover align-middle">
      <thead>
        <tr>
          <th>ID</th>
          <th>POL ID</th>
          <th>Handle</th>
          <th>SQ ACC</th>
          <th>2FA Active</th>
          <th class="text-end">Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="entry in entries" :key="entry.id">
          <td>{{ entry.id }}</td>
          <td>{{ entry.pol_id }}</td>
          <td>{{ entry.handle }}</td>
          <td>{{ entry.sq_acc }}</td>
          <td class="text-center">
            <i :class="entry.auth_token ? 'fas fa-check text-success' : 'fas fa-times text-danger'"></i>
          </td>
          <td class="text-end d-flex justify-content-end gap-1">
            <button class="btn btn-sm btn-primary" @click="copyPolId(entry)">
              <i class="fas fa-copy"></i>
            </button>
            <button class="btn btn-sm btn-warning" @click="editEntry(entry)">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger" @click="deleteEntry(entry.id)">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <div
      class="toast-container position-fixed top-0 end-0 p-3"
      style="z-index: 1060"
    >
      <div
        class="toast align-items-center text-white bg-success border-0"
        role="alert"
        :class="{ show: toastVisible }"
      >
        <div class="d-flex">
          <div class="toast-body">
            POL ID copied to clipboard!
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" @click="toastVisible = false"></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      entries: [],
      form: { polId: "", handle: "", sqAcc: "", twoFA: false },
      editing: false,
      editId: null,
      toastVisible: false
    };
  },

  methods: {
    async fetchEntries() {
      try {
        const res = await axios.get("http://localhost:3000/api/entries");
        this.entries = res.data;
      } catch (err) {
        console.error(err);
      }
    },

    async saveEntry() {
      try {
        if (this.editing) {
          await axios.put(`http://localhost:3000/api/entries/${this.editId}`, this.form);
          this.editing = false;
          this.editId = null;
        } else {
          await axios.post("http://localhost:3000/api/entries", this.form);
        }
        this.form = { polId: "", handle: "", sqAcc: "", twoFA: false };
        this.fetchEntries();
      } catch (err) {
        console.error(err);
      }
    },

    editEntry(entry) {
      this.editing = true;
      this.editId = entry.id;
      this.form = {
        polId: entry.pol_id,
        handle: entry.handle,
        sqAcc: entry.sq_acc,
        twoFA: entry.two_fa
      };
    },

    cancelEdit() {
      this.editing = false;
      this.editId = null;
      this.form = { polId: "", handle: "", sqAcc: "", twoFA: false };
    },

    async deleteEntry(id) {
      try {
        await axios.delete(`http://localhost:3000/api/entries/${id}`);
        this.fetchEntries();
      } catch (err) {
        console.error(err);
      }
    },

    copyPolId(entry) {
      if (!entry.pol_id) return;
      navigator.clipboard.writeText(entry.pol_id).then(() => {
        this.toastVisible = true;
        setTimeout(() => {
          this.toastVisible = false;
        }, 2000);
      }).catch(err => console.error(err));
    }
  },

  mounted() {
    this.fetchEntries();
  }
};
</script>

<style>
body {
  background-color: #f8f9fa;
}

.table td {
  vertical-align: middle;
}

.btn {
  min-width: 36px;
}

.toast {
  transition: opacity 0.3s ease;
  opacity: 0;
}

.toast.show {
  opacity: 1;
}
</style>
