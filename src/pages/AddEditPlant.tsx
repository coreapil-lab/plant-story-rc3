import "./AddEditPlant.css";
.form-card {
  margin-top: 18px;
  padding: 22px 20px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(213, 236, 204, 0.9);
  box-shadow: 0 14px 40px rgba(83, 122, 75, 0.1);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 18px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-label {
  font-size: 17px;
  font-weight: 800;
  color: #203622;
}

.form-input,
.form-textarea {
  width: 100%;
  border: none;
  outline: none;
  border-radius: 18px;
  background: #eef8ea;
  color: #203622;
  font-size: 17px;
  font-weight: 700;
  box-sizing: border-box;
}

.form-input {
  min-height: 54px;
  padding: 0 16px;
}

.form-textarea {
  min-height: 130px;
  padding: 15px 16px;
  resize: none;
  line-height: 1.5;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #8ca08d;
}

.form-input:focus,
.form-textarea:focus {
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(105, 180, 110, 0.2);
}

@media (max-width: 480px) {
  .form-card {
    padding: 20px 18px;
    border-radius: 24px;
  }

  .form-label {
    font-size: 16px;
  }

  .form-input,
  .form-textarea {
    font-size: 16px;
  }
}