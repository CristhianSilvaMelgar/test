import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  form: FormGroup;
  public loginInvalid = false;
  private formSubmitAttempt = false;
  constructor(private fb: FormBuilder,public auth: AuthService,private router: Router) { 
    this.form = this.fb.group({
      email: ['', [Validators.email,Validators.required]],
      password: ['', [Validators.required,Validators.minLength(6)]]
    });
    if(this.auth.user$){
      router.navigate(['/main']);
    }
  }
  

  ngOnInit(): void {
  }

  async onSubmit(): Promise<void> {
    this.loginInvalid = false;
    this.formSubmitAttempt = false;
    if (this.form.valid) {
      try {
        const email = this.form.get('email').value;
        const password = this.form.get('password').value;
        console.log(email as string+' '+password);
        await this.auth.login(email, password);
      } catch (err) {
        this.loginInvalid = true;
      }
    } else {
      this.formSubmitAttempt = true;
    }
  }

}
