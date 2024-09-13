import { CommonModule, NgIf, isPlatformBrowser } from "@angular/common";
import { AfterViewInit, Component, ElementRef, OnInit, PLATFORM_ID, Renderer2, ViewChild, inject } from "@angular/core";
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from "@angular/router";

@Component({
   selector: "app-authentication-main",
   standalone: true,
   imports: [RouterOutlet, NgIf, RouterLink, CommonModule],
   templateUrl: "./authentication-main.component.html",
   styleUrl: "./authentication-main.component.scss",
})
export class AuthenticationMainComponent implements OnInit, AfterViewInit {
   renderer = inject(Renderer2);
   showAnimation = true;
   showLogoInCorner = false;
   router = inject(Router);
   activatedRoute = inject(ActivatedRoute);
   platformId = inject(PLATFORM_ID);
   isBrowser = isPlatformBrowser(this.platformId);

   @ViewChild("linksContainer") linksContainer!: ElementRef;

   constructor() {}

   ngOnInit(): void {
      this.router.events.subscribe(() => {
         const currentUrl = this.router.url;
         const hideLinks = currentUrl.includes("/impressum") || currentUrl.includes("/datenschutz");
         if (hideLinks) {
            this.renderer.setStyle(this.linksContainer.nativeElement, "display", "none");
         } else {
            this.renderer.removeStyle(this.linksContainer.nativeElement, "display");
         }
      });

      this.activatedRoute.firstChild?.url.subscribe((urlSegment) => {
         this.showAnimation = urlSegment[0]?.path === "login";
         this.showLogoInCorner = !this.showAnimation;
      });
   }

   ngAfterViewInit(): void {
      if (typeof document !== "undefined" && (this.showAnimation || this.showLogoInCorner)) {
         setTimeout(() => {
            this.renderer.addClass(document.getElementById("bgc"), "hide-background");
            this.renderer.addClass(document.getElementById("animation-background"), "animation-layer");
         }, 2500);
      }
   }
}
