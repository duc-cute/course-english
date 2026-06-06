package com.courseenglish.api.domain.request;

import lombok.Getter;
import lombok.Setter;

public class ReqChangePasswordDTO {
    private String currentPass;
    private String newPass;

    public String getCurrentPass() {
        return currentPass;
    }

    public void setCurrentPass(String currentPass) {
        this.currentPass = currentPass;
    }

    public String getNewPass() {
        return newPass;
    }

    public void setNewPass(String newPass) {
        this.newPass = newPass;
    }
}
