import { EnvironmentProviders, makeEnvironmentProviders, inject } from '@angular/core';
import { ImagekitioAngularModule } from 'imagekitio-angular';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { firstValueFrom } from 'rxjs';

export const provideImageKit = (): EnvironmentProviders => {
  return makeEnvironmentProviders([
    ImagekitioAngularModule.forRoot({
      publicKey: environment.imageKit.publicKey,
      urlEndpoint: environment.imageKit.urlEndpoint,
      authenticator: async () => {
        const authService = inject(AuthService);
        return await firstValueFrom(authService.getImageKitAuth());
      }
    }).providers || []
  ]);
};
